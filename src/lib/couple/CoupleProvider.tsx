import { onSnapshot } from 'firebase/firestore';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { paths } from '@/constants/firestorePaths';
import { ensureSignedIn, ensureUserProfileExists, updateUserProfile } from '@/lib/firebase/auth';
import { docRef } from '@/lib/firebase/firestore';
import { registerForPushNotificationsAsync } from '@/lib/push/notifications';
import type { Couple, CoupleId, UserId, UserProfile } from '@/types/models';

interface CoupleContextValue {
  /** Still resolving auth + the initial profile/couple snapshot. */
  loading: boolean;
  userId: UserId | null;
  profile: UserProfile | null;
  coupleId: CoupleId | null;
  couple: Couple | null;
  partnerId: UserId | null;
  partnerProfile: UserProfile | null;
  /** True once both memberIds are populated -- safe to enter the notebook. */
  isPaired: boolean;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<UserId | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);

  // 1. Sign in (or restore session), then subscribe to our own profile doc.
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let cancelled = false;

    ensureSignedIn().then((user) => {
      if (cancelled) return;
      setUserId(user.uid);
      ensureUserProfileExists(user.uid); // fire-and-forget; the snapshot below picks it up
      unsubProfile = onSnapshot(docRef<UserProfile>(paths.user(user.uid)), (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
      unsubProfile?.();
    };
  }, []);

  // 2. Once we know our coupleId, subscribe to the couple doc.
  const coupleId = profile?.coupleId ?? null;
  useEffect(() => {
    if (!coupleId) {
      // Resetting local state to match an external identity (coupleId) going away --
      // no subscription exists yet at this point, so there's no cascading-render risk
      // the set-state-in-effect rule is meant to catch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCouple(null);
      return;
    }
    const unsub = onSnapshot(docRef<Couple>(paths.couple(coupleId)), (snap) => {
      setCouple(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [coupleId]);

  // 3. Once we know the partner's uid, subscribe to their profile.
  const partnerId = useMemo(
    () => couple?.memberIds.find((id) => id !== userId) ?? null,
    [couple, userId]
  );
  useEffect(() => {
    if (!partnerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see coupleId reset above
      setPartnerProfile(null);
      return;
    }
    const unsub = onSnapshot(docRef<UserProfile>(paths.user(partnerId)), (snap) => {
      setPartnerProfile(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [partnerId]);

  const isPaired = (couple?.memberIds.length ?? 0) >= 2;

  // 4. Once paired, register for push (deferred until here so we don't prompt for
  // notification permission before the pairing flow even starts) and save the token
  // -- this is what makes signals/turn-notifications/reveal pushes actually deliverable.
  useEffect(() => {
    if (!userId || !isPaired) return;
    let cancelled = false;
    registerForPushNotificationsAsync().then((token) => {
      if (cancelled || !token) return;
      updateUserProfile(userId, { expoPushToken: token });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isPaired]);

  const value: CoupleContextValue = {
    loading,
    userId,
    profile,
    coupleId,
    couple,
    partnerId,
    partnerProfile,
    isPaired,
  };

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>;
}

export function useCouple(): CoupleContextValue {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error('useCouple must be used within a CoupleProvider');
  return ctx;
}
