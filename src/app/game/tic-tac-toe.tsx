import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { gamesCopy, notificationsCopy, ticTacToeCopy } from '@/constants/copy';
import { paperColors, spacing } from '@/constants/theme';
import { useGameSession } from '@/lib/games/useGameSession';
import { checkWinner, emptyBoard, type Mark, type TicTacToeState } from '@/lib/games/ticTacToe';
import { sendPushNotification } from '@/lib/push/notifications';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useCouple } from '@/lib/couple/CoupleProvider';

import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';

export default function TicTacToeScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();

  const { session, loading, update, startNewRound } = useGameSession<TicTacToeState>({
    coupleId,
    userId,
    partnerId,
    type: 'tic_tac_toe',
    createInitialState: emptyBoard,
    firstTurn: (a) => a,
  });

  const myMark: Mark | null = session ? (session.playerIds[0] === userId ? 'X' : 'O') : null;
  const isMyTurn = !!session && session.status === 'active' && session.currentTurn === userId;

  const prevTurn = useRef<string | null>(null);
  useEffect(() => {
    if (!session) return;
    // Notify the partner only on the transition INTO their turn, not every render.
    if (prevTurn.current !== session.currentTurn && session.currentTurn === partnerId && partnerProfile?.expoPushToken) {
      sendPushNotification({
        to: partnerProfile.expoPushToken,
        title: notificationsCopy.gameTurnTitle,
        body: ticTacToeCopy.title,
      });
    }
    prevTurn.current = session.currentTurn;
  }, [session, partnerId, partnerProfile]);

  const playCell = useCallback(
    (index: number) => {
      if (!session || !userId || !myMark || !isMyTurn || session.state.board[index]) return;
      update((current) => {
        const board = [...current.state.board];
        board[index] = myMark;
        const result = checkWinner(board);
        const finished = result !== null;
        return {
          state: { board },
          status: finished ? 'finished' : 'active',
          winnerId: result === 'draw' ? 'draw' : result ? userId : null,
          currentTurn: finished ? null : (partnerId as string),
          history: [...current.history, { index, mark: myMark }],
        };
      });
      if (coupleId) recordSparkEvent(coupleId, 'game_move');
    },
    [session, userId, myMark, isMyTurn, update, partnerId, coupleId]
  );

  if (loading || !session) {
    return (
      <NotebookScreen>
        <PencilText variant="label">flipping the page...</PencilText>
      </NotebookScreen>
    );
  }

  const gameOver = session.status === 'finished';
  const iWon = session.winnerId === userId;
  const isDraw = session.winnerId === 'draw';

  return (
    <NotebookScreen scroll={false}>
      <View style={styles.header}>
        {myMark && <PencilText variant="small">{ticTacToeCopy.yourMark(myMark)}</PencilText>}
        <PencilText variant="label">
          {gameOver
            ? isDraw
              ? gamesCopy.gameOverDraw
              : iWon
                ? gamesCopy.gameOverWin
                : gamesCopy.gameOverLose
            : isMyTurn
              ? gamesCopy.yourTurn
              : gamesCopy.waitingOnPartner(partnerProfile?.displayName || 'them')}
        </PencilText>
      </View>

      <View style={styles.board}>
        {session.state.board.map((cell, i) => (
          <Pressable key={i} onPress={() => playCell(i)} style={styles.cellWrap}>
            <PencilCard seedKey={`cell-${i}`} style={styles.cell}>
              <PencilText variant="title">{cell ?? ''}</PencilText>
            </PencilCard>
          </Pressable>
        ))}
      </View>

      {gameOver && (
        <PencilButton label={gamesCopy.rematchButton} onPress={startNewRound} style={styles.rematch} />
      )}
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 3 * 92,
    alignSelf: 'center',
  },
  cellWrap: {
    width: 92,
    height: 92,
    padding: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paperColors.page,
  },
  rematch: {
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
});
