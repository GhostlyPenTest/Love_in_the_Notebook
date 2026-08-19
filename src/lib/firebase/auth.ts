// See lib/firebase/init.ts for why this imports from @firebase/auth rather
// than the firebase/auth wrapper.
import { type User as FirebaseUser, onAuthStateChanged, signInAnonymously } from '@firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';

import { paths } from '@/constants/firestorePaths';
import type { Couple, CoupleId, UserId, UserProfile } from '@/types/models';

import { auth, db } from './init';
import { docRef } from './firestore';

/** Resolves once Firebase has restored (or created) an anonymous session. */
export function ensureSignedIn(): Promise<FirebaseUser> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          signInAnonymously(auth).then((cred) => resolve(cred.user), reject);
        }
      },
      reject
    );
  });
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I — easy to misread

function generatePairingCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Creates the user's profile doc with full defaults, but ONLY if it doesn't
 * already exist. Safe to call every launch.
 */
export async function ensureUserProfileExists(userId: UserId): Promise<void> {
  const ref = docRef<UserProfile>(paths.user(userId));
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    id: userId,
    displayName: '',
    doodleSet: 'floral',
    coupleId: null,
    expoPushToken: null,
    createdAt: Date.now(),
  } satisfies UserProfile);
}

/**
 * True partial update -- only ever writes the fields passed in `patch`.
 *
 * IMPORTANT: this used to also always write `coupleId: null` as a baseline
 * default alongside the merge, which meant ANY call after pairing (e.g.
 * saving the push token) silently wiped `coupleId` back to null and bounced
 * the user back to the pairing screen. Keep this function pure-partial;
 * defaults belong only in ensureUserProfileExists, called once at creation.
 */
export async function updateUserProfile(
  userId: UserId,
  patch: Partial<Pick<UserProfile, 'displayName' | 'doodleSet' | 'expoPushToken'>>
): Promise<void> {
  await setDoc(docRef<UserProfile>(paths.user(userId)), patch, { merge: true });
}

/** Starts a brand-new notebook. Returns the pairing code to hand to the partner. */
export async function createCouple(userId: UserId): Promise<{ coupleId: CoupleId; code: string }> {
  const coupleRef = doc(db, paths.couples());
  const coupleId = coupleRef.id;
  const code = generatePairingCode();

  await runTransaction(db, async (tx) => {
    tx.set(coupleRef, {
      id: coupleId,
      memberIds: [userId],
      pairingCode: code,
      createdAt: Date.now(),
      createdBy: userId,
    } satisfies Couple);
    tx.set(doc(db, paths.pairingCode(code)), {
      coupleId,
      createdAt: serverTimestamp(),
      used: false,
    });
    tx.update(doc(db, paths.user(userId)), { coupleId });
  });

  return { coupleId, code };
}

export class InvalidPairingCodeError extends Error {}
export class CoupleAlreadyFullError extends Error {}

/** Joins an existing notebook using the code the first partner generated. */
export async function joinCoupleWithCode(userId: UserId, rawCode: string): Promise<CoupleId> {
  const code = rawCode.trim().toUpperCase();
  const codeRef = doc(db, paths.pairingCode(code));

  const coupleId = await runTransaction(db, async (tx) => {
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists() || codeSnap.data().used) {
      throw new InvalidPairingCodeError(code);
    }
    const targetCoupleId: CoupleId = codeSnap.data().coupleId;
    const coupleDocRef = doc(db, paths.couple(targetCoupleId));
    const coupleSnap = await tx.get(coupleDocRef);
    if (!coupleSnap.exists()) {
      throw new InvalidPairingCodeError(code);
    }
    const couple = coupleSnap.data() as Couple;
    if (couple.memberIds.includes(userId)) {
      return targetCoupleId; // already a member (e.g. re-running after a partial failure)
    }
    if (couple.memberIds.length >= 2) {
      throw new CoupleAlreadyFullError(targetCoupleId);
    }

    tx.update(coupleDocRef, { memberIds: [...couple.memberIds, userId] });
    tx.update(codeRef, { used: true });
    tx.update(doc(db, paths.user(userId)), { coupleId: targetCoupleId });

    return targetCoupleId;
  });

  return coupleId;
}
