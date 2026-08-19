import { onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { battleshipCopy, gamesCopy, notificationsCopy } from '@/constants/copy';
import { paths } from '@/constants/firestorePaths';
import { paperColors, spacing } from '@/constants/theme';
import { docRef } from '@/lib/firebase/firestore';
import {
  BOARD_SIZE,
  SHIP_SIZES,
  allShipsSunk,
  type BattleshipPlacement,
  type BattleshipState,
  canPlaceShip,
  emptyBattleshipState,
  isHit,
  isShipSunk,
  type ShipPlacement,
} from '@/lib/games/battleship';
import { useGameSession } from '@/lib/games/useGameSession';
import { sendPushNotification } from '@/lib/push/notifications';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useCouple } from '@/lib/couple/CoupleProvider';
import type { MutualSubmission } from '@/types/models';

import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilText } from '@/components/paper/PencilText';

function useMyShips(sessionPath: string, userId: string | null, round: number) {
  const [ships, setShips] = useState<ShipPlacement[] | null>(null);
  useEffect(() => {
    if (!sessionPath || !userId) return;
    // Reset before re-subscribing on a new round/session identity -- same pattern as
    // lib/couple/CoupleProvider.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShips(null);
    const path = paths.submissionOf(sessionPath, `${userId}-r${round}`);
    return onSnapshot(docRef<MutualSubmission<BattleshipPlacement>>(path), (snap) =>
      setShips(snap.exists() ? snap.data().content.ships : null)
    );
  }, [sessionPath, userId, round]);
  return ships;
}

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

export default function BattleshipScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();

  const { session, loading, update } = useGameSession<BattleshipState>({
    coupleId,
    userId,
    partnerId,
    type: 'battleship',
    createInitialState: () => emptyBattleshipState(0),
    firstTurn: (a) => a,
  });

  const sessionPath = coupleId ? paths.gameSession(coupleId, 'battleship') : '';
  const round = session?.state.round ?? 0;
  const myShips = useMyShips(sessionPath, userId, round);

  // --- placement (local, unsubmitted) ---
  const [placedShips, setPlacedShips] = useState<ShipPlacement[]>([]);
  const [orientation, setOrientation] = useState<'h' | 'v'>('h');
  const currentShipIndex = placedShips.length;
  useEffect(() => {
    // Resetting the local (unsubmitted) placement draft when a rematch bumps `round`.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPlacedShips([]);
    setOrientation('h');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [round]);

  const iAmReady = !!(session && userId && session.state.ready[userId]);

  function placeCell(x: number, y: number) {
    if (currentShipIndex >= SHIP_SIZES.length) return;
    const cells = canPlaceShip(placedShips, x, y, SHIP_SIZES[currentShipIndex], orientation);
    if (!cells) return;
    setPlacedShips((prev) => [...prev, { cells }]);
  }

  async function confirmFleet() {
    if (!userId || !partnerId || !sessionPath || placedShips.length !== SHIP_SIZES.length) return;
    await setDoc(docRef<MutualSubmission<BattleshipPlacement>>(paths.submissionOf(sessionPath, `${userId}-r${round}`)), {
      userId,
      content: { ships: placedShips },
      submittedAt: Date.now(),
    });
    await update((current) => {
      const ready = { ...current.state.ready, [userId]: true as const };
      const bothReady = !!(partnerId && ready[partnerId]);
      const nextState: BattleshipState = { ...current.state, ready, phase: bothReady ? 'battle' : 'placement' };
      return { state: nextState, currentTurn: bothReady ? [userId, partnerId].sort()[0] : current.currentTurn };
    });
  }

  // --- battle ---
  const myShots = useMemo(() => session?.state.shotsBy[userId ?? ''] ?? [], [session, userId]);
  const theirShotsOnMe = useMemo(() => session?.state.shotsBy[partnerId ?? ''] ?? [], [session, partnerId]);
  const alreadyShot = useMemo(() => new Set(myShots.map((s) => cellKey(s.x, s.y))), [myShots]);
  const isMyTurn = !!session && session.status === 'active' && session.state.phase === 'battle' && session.currentTurn === userId;

  async function fireAt(x: number, y: number) {
    if (!session || !userId || !isMyTurn || session.state.pendingShot || alreadyShot.has(cellKey(x, y))) return;
    await update((current) => ({ state: { ...current.state, pendingShot: { by: userId, x, y } } }));
    if (coupleId) recordSparkEvent(coupleId, 'game_move');
  }

  const resolving = useRef(false);
  useEffect(() => {
    const pending = session?.state.pendingShot;
    if (!session || !pending || pending.by !== partnerId || !myShips || !userId || !partnerId) return;
    if (resolving.current) return;
    resolving.current = true;

    const { x, y } = pending;
    const hit = isHit(myShips, x, y);
    const priorHits = theirShotsOnMe.filter((s) => s.hit).map((s) => ({ x: s.x, y: s.y }));
    const allHits = hit ? [...priorHits, { x, y }] : priorHits;
    const hitShip = myShips.find((s) => s.cells.some(([cx, cy]) => cx === x && cy === y));
    const sunk = hit && !!hitShip && isShipSunk(hitShip, allHits);
    const gameOver = hit && allShipsSunk(myShips, allHits);

    update((current) => {
      const prevShots = current.state.shotsBy[partnerId] ?? [];
      return {
        state: {
          ...current.state,
          pendingShot: null,
          shotsBy: { ...current.state.shotsBy, [partnerId]: [...prevShots, { x, y, hit, sunk }] },
        },
        currentTurn: gameOver ? null : userId,
        status: gameOver ? 'finished' : 'active',
        winnerId: gameOver ? partnerId : null,
      };
    }).finally(() => {
      resolving.current = false;
    });
  }, [session, myShips, partnerId, userId, theirShotsOnMe, update]);

  const prevTurn = useRef<string | null>(null);
  useEffect(() => {
    if (!session) return;
    if (prevTurn.current !== session.currentTurn && session.currentTurn === partnerId && partnerProfile?.expoPushToken) {
      sendPushNotification({ to: partnerProfile.expoPushToken, title: notificationsCopy.gameTurnTitle, body: battleshipCopy.title });
    }
    prevTurn.current = session.currentTurn;
  }, [session, partnerId, partnerProfile]);

  async function handleRematch() {
    if (!session || !userId || !partnerId) return;
    const nextRound = (session.state.round ?? 0) + 1;
    const sortedIds = [userId, partnerId].sort();
    await update(() => ({
      state: emptyBattleshipState(nextRound),
      status: 'active',
      winnerId: null,
      currentTurn: sortedIds[0],
    }));
  }

  if (loading || !session) {
    return (
      <NotebookScreen>
        <PencilText variant="label">flipping the page...</PencilText>
      </NotebookScreen>
    );
  }

  const gameOver = session.status === 'finished';

  return (
    <NotebookScreen>
      {session.state.phase === 'placement' && !iAmReady && (
        <View>
          <PencilText variant="label">{battleshipCopy.placementPrompt}</PencilText>
          <PencilText variant="small">{battleshipCopy.placementSubtitle}</PencilText>
          <PencilText variant="small" style={styles.spacer}>
            {currentShipIndex < SHIP_SIZES.length
              ? `placing ship ${currentShipIndex + 1}/${SHIP_SIZES.length} (size ${SHIP_SIZES[currentShipIndex]}, ${orientation === 'h' ? 'sideways' : 'up n down'})`
              : "fleet's ready to confirm"}
          </PencilText>
          <View style={styles.controlRow}>
            <PencilButton label="rotate" variant="ghost" onPress={() => setOrientation((o) => (o === 'h' ? 'v' : 'h'))} />
            <PencilButton label="reset" variant="ghost" onPress={() => setPlacedShips([])} />
          </View>
          <Board
            size={BOARD_SIZE}
            onCellPress={placeCell}
            render={(x, y) => {
              const placed = placedShips.some((s) => s.cells.some(([cx, cy]) => cx === x && cy === y));
              return placed ? styles.cellShip : styles.cellWater;
            }}
          />
          {currentShipIndex >= SHIP_SIZES.length && (
            <PencilButton label={battleshipCopy.readyButton} onPress={confirmFleet} style={styles.spacer} />
          )}
        </View>
      )}

      {session.state.phase === 'placement' && iAmReady && (
        <PencilText variant="label">{battleshipCopy.waitingForPartnerPlacement}</PencilText>
      )}

      {session.state.phase === 'battle' && (
        <View>
          <PencilText variant="label" style={styles.spacer}>
            {gameOver
              ? session.winnerId === userId
                ? battleshipCopy.gameOverWin
                : battleshipCopy.gameOverLose
              : isMyTurn
                ? battleshipCopy.yourTurnPrompt
                : gamesCopy.waitingOnPartner(partnerProfile?.displayName || 'them')}
          </PencilText>

          <PencilText variant="small">their waters (tap to fire)</PencilText>
          <Board
            size={BOARD_SIZE}
            onCellPress={fireAt}
            render={(x, y) => {
              const shot = myShots.find((s) => s.x === x && s.y === y);
              if (!shot) return styles.cellWater;
              return shot.hit ? styles.cellHit : styles.cellMiss;
            }}
          />

          <PencilText variant="small" style={styles.spacer}>
            your waters
          </PencilText>
          <Board
            size={BOARD_SIZE}
            onCellPress={() => {}}
            render={(x, y) => {
              const isShip = myShips?.some((s) => s.cells.some(([cx, cy]) => cx === x && cy === y));
              const shotAgainstMe = theirShotsOnMe.find((s) => s.x === x && s.y === y);
              if (shotAgainstMe?.hit) return styles.cellHit;
              if (shotAgainstMe) return styles.cellMiss;
              return isShip ? styles.cellShip : styles.cellWater;
            }}
          />

          {gameOver && <PencilButton label={gamesCopy.rematchButton} onPress={handleRematch} style={styles.spacer} />}
        </View>
      )}
    </NotebookScreen>
  );
}

function Board({
  size,
  onCellPress,
  render,
}: {
  size: number;
  onCellPress: (x: number, y: number) => void;
  render: (x: number, y: number) => object;
}) {
  return (
    <View style={styles.board}>
      {Array.from({ length: size }, (_, y) => (
        <View key={y} style={styles.boardRow}>
          {Array.from({ length: size }, (_, x) => (
            <Pressable key={x} onPress={() => onCellPress(x, y)} style={[styles.cell, render(x, y)]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const CELL = 36;

const styles = StyleSheet.create({
  spacer: {
    marginTop: spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  board: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  boardRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL,
    height: CELL,
    borderWidth: 1,
    borderColor: paperColors.ruleBlue,
  },
  cellWater: {
    backgroundColor: paperColors.page,
  },
  cellShip: {
    backgroundColor: paperColors.inkBlueSoft,
  },
  cellHit: {
    backgroundColor: paperColors.danger,
  },
  cellMiss: {
    backgroundColor: paperColors.pencilFaint,
  },
});
