import { onSnapshot, runTransaction } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { paths } from '@/constants/firestorePaths';
import { db } from '@/lib/firebase/init';
import { docRef } from '@/lib/firebase/firestore';
import type { CoupleId, GameSession, GameType, UserId } from '@/types/models';

/**
 * One deterministic session doc per couple per game type
 * (gameSessions/{coupleId}/sessions/{type}) rather than a query for "the
 * active one" -- this sidesteps the race of both partners' clients trying to
 * create a session at the same moment (guarded inside a transaction below),
 * and a rematch just resets the same doc instead of orphaning old ones.
 * History still accumulates in `history` across rounds unless a game
 * explicitly clears it on rematch.
 */
export function useGameSession<TState>({
  coupleId,
  userId,
  partnerId,
  type,
  createInitialState,
  firstTurn,
}: {
  coupleId: CoupleId | null;
  userId: UserId | null;
  partnerId: UserId | null;
  type: GameType;
  createInitialState: () => TState;
  /** Who moves first on a brand-new session. */
  firstTurn: (a: UserId, b: UserId) => UserId;
}) {
  const sessionPath = coupleId ? paths.gameSession(coupleId, type) : '';
  const [session, setSession] = useState<GameSession<TState> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionPath) return;
    const unsub = onSnapshot(docRef<GameSession<TState>>(sessionPath), (snap) => {
      setSession(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [sessionPath]);

  useEffect(() => {
    if (!coupleId || !userId || !partnerId || loading || session) return;
    const sessionRef = docRef<GameSession<TState>>(sessionPath);
    runTransaction(db, async (tx) => {
      const snap = await tx.get(sessionRef);
      if (snap.exists()) return;
      // Sorted so "playerIds[0]" means the same thing (e.g. "plays X") no
      // matter which of the two devices happens to win the create race.
      const sortedIds = [userId, partnerId].sort();
      const initial: GameSession<TState> = {
        id: type,
        coupleId,
        type,
        state: createInitialState(),
        currentTurn: firstTurn(sortedIds[0], sortedIds[1]),
        playerIds: sortedIds,
        status: 'active',
        winnerId: null,
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tx.set(sessionRef, initial);
    }).catch((err) => console.warn('[game] failed to create session', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, userId, partnerId, loading, session, sessionPath]);

  const update = useMemo(
    () => async (updater: (current: GameSession<TState>) => Partial<GameSession<TState>>) => {
      const sessionRef = docRef<GameSession<TState>>(sessionPath);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(sessionRef);
        if (!snap.exists()) return;
        const patch = updater(snap.data());
        tx.set(sessionRef, { ...snap.data(), ...patch, updatedAt: Date.now() }, { merge: true });
      });
    },
    [sessionPath]
  );

  const startNewRound = useMemo(
    () => async () => {
      if (!userId || !partnerId || !coupleId) return;
      const sessionRef = docRef<GameSession<TState>>(sessionPath);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(sessionRef);
        const prevHistory = snap.exists() ? snap.data().history : [];
        const sortedIds = [userId, partnerId].sort();
        tx.set(
          sessionRef,
          {
            id: type,
            coupleId,
            type,
            state: createInitialState(),
            currentTurn: firstTurn(sortedIds[0], sortedIds[1]),
            playerIds: sortedIds,
            status: 'active',
            winnerId: null,
            history: prevHistory,
            createdAt: snap.exists() ? snap.data().createdAt : Date.now(),
            updatedAt: Date.now(),
          } satisfies GameSession<TState>,
          { merge: false }
        );
      });
    },
    [sessionPath, userId, partnerId, coupleId, type, createInitialState, firstTurn]
  );

  return { session, loading: loading || !session, update, startNewRound };
}
