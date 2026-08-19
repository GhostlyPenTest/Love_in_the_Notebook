import { onSnapshot, runTransaction } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { paths } from '@/constants/firestorePaths';
import { db } from '@/lib/firebase/init';
import { docRef } from '@/lib/firebase/firestore';
import type { CoupleId, MutualEntryMeta, MutualSubmission, UserId } from '@/types/models';

export interface UseMutualRevealParams {
  /** Path to the meta doc, e.g. paths.moodEntry(coupleId, date) or paths.gameSession(...). */
  metaPath: string;
  coupleId: CoupleId;
  /** The meta doc's own key field (date, or session id) -- stored for debugging/queries. */
  entryKey: string;
  userId: UserId | null;
  partnerId: UserId | null;
}

export interface UseMutualRevealResult<TContent> {
  loading: boolean;
  /** Have I submitted yet? */
  hasSubmitted: boolean;
  /** Has my partner submitted yet? (we know THIS without seeing their content) */
  partnerHasSubmitted: boolean;
  /** True once both sides are in -- content becomes visible. */
  isRevealed: boolean;
  mySubmission: TContent | null;
  partnerSubmission: TContent | null;
  /** Submits once; a no-op if this user already submitted (submissions are immutable). */
  submit: (content: TContent) => Promise<void>;
}

/**
 * Generic Mutual Reveal engine: submit -> hidden -> both in -> reveal.
 * Powers Mood Weather, the Journal, and Daily Duel Trivia.
 *
 * Hiding is enforced by firestore.rules on the `submissions` subcollection,
 * not just by this hook choosing not to expose the value -- see the rules
 * file for the actual trust boundary.
 */
export function useMutualReveal<TContent>({
  metaPath,
  coupleId,
  entryKey,
  userId,
  partnerId,
}: UseMutualRevealParams): UseMutualRevealResult<TContent> {
  const [meta, setMeta] = useState<MutualEntryMeta | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [mySubmission, setMySubmission] = useState<TContent | null>(null);
  const [partnerSubmission, setPartnerSubmission] = useState<TContent | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(docRef<MutualEntryMeta>(metaPath), (snap) => {
      setMeta(snap.exists() ? snap.data() : null);
      setMetaLoaded(true);
    });
    return unsub;
  }, [metaPath]);

  const isRevealed = !!meta?.revealedAt;
  const partnerHasSubmitted = !!(partnerId && meta?.submittedBy?.[partnerId]);
  const hasSubmitted = !!(userId && meta?.submittedBy?.[userId]);

  // Own submission: always readable, subscribe once we know who we are.
  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(
      docRef<MutualSubmission<TContent>>(paths.submissionOf(metaPath, userId)),
      (snap) => setMySubmission(snap.exists() ? snap.data().content : null)
    );
    return unsub;
  }, [metaPath, userId]);

  // Partner's submission: only fetchable (by rule) once revealed -- and only
  // worth subscribing to once we know it exists, to avoid a guaranteed
  // permission-denied read on every render before that.
  useEffect(() => {
    if (!partnerId || !isRevealed) {
      // Resetting to match an external identity going away, before any subscription
      // exists; see lib/couple/CoupleProvider.tsx for the same pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPartnerSubmission(null);
      return;
    }
    const unsub = onSnapshot(
      docRef<MutualSubmission<TContent>>(paths.submissionOf(metaPath, partnerId)),
      (snap) => setPartnerSubmission(snap.exists() ? snap.data().content : null)
    );
    return unsub;
  }, [metaPath, partnerId, isRevealed]);

  const submit = useMemo(
    () =>
      async (content: TContent) => {
        if (!userId) throw new Error('useMutualReveal: submit() called before sign-in resolved');
        const metaRef = docRef<MutualEntryMeta>(metaPath);
        const subRef = docRef<MutualSubmission<TContent>>(paths.submissionOf(metaPath, userId));

        await runTransaction(db, async (tx) => {
          const metaSnap = await tx.get(metaRef);
          const prevSubmittedBy = metaSnap.exists() ? metaSnap.data().submittedBy : {};
          if (prevSubmittedBy[userId]) return; // already locked in, submissions are immutable

          const nextSubmittedBy = { ...prevSubmittedBy, [userId]: true };
          const bothIn = !!(partnerId && nextSubmittedBy[partnerId]);

          tx.set(subRef, { userId, content, submittedAt: Date.now() });
          tx.set(
            metaRef,
            {
              coupleId,
              key: entryKey,
              submittedBy: nextSubmittedBy,
              revealedAt: bothIn ? Date.now() : (metaSnap.data()?.revealedAt ?? null),
            },
            { merge: true }
          );
        });
      },
    [metaPath, coupleId, entryKey, userId, partnerId]
  );

  return {
    loading: !metaLoaded,
    hasSubmitted,
    partnerHasSubmitted,
    isRevealed,
    mySubmission,
    partnerSubmission,
    submit,
  };
}
