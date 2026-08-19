import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { gamesCopy, notificationsCopy, wordChainCopy } from '@/constants/copy';
import { paperColors, spacing } from '@/constants/theme';
import { useGameSession } from '@/lib/games/useGameSession';
import {
  emptyChain,
  requiredStartLetter,
  validateMove,
  type WordChainError,
  type WordChainState,
} from '@/lib/games/wordChain';
import { sendPushNotification } from '@/lib/push/notifications';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useCouple } from '@/lib/couple/CoupleProvider';

import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilText } from '@/components/paper/PencilText';

const ERROR_COPY: Partial<Record<Exclude<WordChainError, null>, string>> = {
  invalid_word: wordChainCopy.invalidWord,
  already_used: wordChainCopy.alreadyUsed,
};

export default function WordChainScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();

  const { session, loading, update, startNewRound } = useGameSession<WordChainState>({
    coupleId,
    userId,
    partnerId,
    type: 'word_chain',
    createInitialState: emptyChain,
    firstTurn: (a) => a,
  });

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isMyTurn = !!session && session.status === 'active' && session.currentTurn === userId;
  const requiredLetter = session ? requiredStartLetter(session.state) : null;

  const prevTurn = useRef<string | null>(null);
  useEffect(() => {
    if (!session) return;
    if (prevTurn.current !== session.currentTurn && session.currentTurn === partnerId && partnerProfile?.expoPushToken) {
      sendPushNotification({ to: partnerProfile.expoPushToken, title: notificationsCopy.gameTurnTitle, body: wordChainCopy.title });
    }
    prevTurn.current = session.currentTurn;
  }, [session, partnerId, partnerProfile]);

  async function submitWord() {
    if (!session || !userId || !isMyTurn) return;
    const problem = validateMove(session.state, input);
    if (problem) {
      setError(
        problem === 'wrong_letter'
          ? wordChainCopy.invalidStartLetter(requiredStartLetter(session.state) ?? '')
          : (ERROR_COPY[problem] ?? null)
      );
      return;
    }
    setError(null);
    const word = input.trim().toLowerCase();
    setInput('');
    await update((current) => ({
      state: { chain: [...current.state.chain, { word, userId }] },
      currentTurn: partnerId as string,
      history: [...current.history, { word, userId }],
    }));
    if (coupleId) recordSparkEvent(coupleId, 'game_move');
  }

  async function giveUp() {
    if (!session || !userId || !partnerId) return;
    await update(() => ({ status: 'finished', winnerId: partnerId, currentTurn: null }));
  }

  if (loading || !session) {
    return (
      <NotebookScreen>
        <PencilText variant="label">flipping the page...</PencilText>
      </NotebookScreen>
    );
  }

  const gameOver = session.status === 'finished';
  const lastWord = session.state.chain[session.state.chain.length - 1]?.word;

  return (
    <NotebookScreen>
      <PencilText variant="label" style={styles.status}>
        {gameOver
          ? session.winnerId === userId
            ? gamesCopy.gameOverWin
            : wordChainCopy.chainBrokenBody(lastWord ?? '')
          : isMyTurn
            ? session.state.chain.length === 0
              ? wordChainCopy.firstWordPrompt
              : wordChainCopy.prompt(requiredLetter ?? '')
            : gamesCopy.waitingOnPartner(partnerProfile?.displayName || 'them')}
      </PencilText>

      <FlatList
        data={[...session.state.chain].reverse()}
        keyExtractor={(item, i) => `${item.word}-${i}`}
        style={styles.chainList}
        renderItem={({ item }) => (
          <PencilText variant="body" style={styles.chainWord}>
            {item.word} {item.userId === userId ? '(u)' : `(${partnerProfile?.displayName || 'them'})`}
          </PencilText>
        )}
      />

      {!gameOver && isMyTurn && (
        <View style={styles.composeRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={wordChainCopy.inputPlaceholder}
            placeholderTextColor={paperColors.pencilFaint}
            style={styles.input}
            autoCapitalize="none"
            onSubmitEditing={submitWord}
          />
          <PencilButton label={wordChainCopy.submitButton} onPress={submitWord} style={styles.submitButton} />
        </View>
      )}
      {error && (
        <PencilText variant="small" color={paperColors.danger} style={styles.error}>
          {error}
        </PencilText>
      )}
      {!gameOver && isMyTurn && (
        <PencilButton label="can't think of one" variant="ghost" onPress={giveUp} style={styles.giveUp} />
      )}
      {gameOver && <PencilButton label={gamesCopy.rematchButton} onPress={startNewRound} style={styles.giveUp} />}
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  status: {
    marginBottom: spacing.md,
  },
  chainList: {
    maxHeight: 260,
    marginBottom: spacing.md,
  },
  chainWord: {
    paddingVertical: 3,
  },
  composeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderColor: paperColors.pencilSoft,
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 21,
    color: paperColors.pencil,
    paddingVertical: spacing.xs,
  },
  submitButton: {},
  error: {
    marginTop: spacing.sm,
  },
  giveUp: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
});
