import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { gamesCopy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import type { GameType } from '@/types/models';

import { NotebookHeader } from '@/components/paper/NotebookHeader';
import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';

const GAME_ROUTES: Record<GameType, string> = {
  tic_tac_toe: '/game/tic-tac-toe',
  word_chain: '/game/word-chain',
  trivia: '/game/trivia',
  battleship: '/game/battleship',
};

const ORDER: GameType[] = ['tic_tac_toe', 'word_chain', 'trivia', 'battleship'];

export default function GamesListScreen() {
  const router = useRouter();

  return (
    <NotebookScreen>
      <NotebookHeader title={gamesCopy.screenTitle} subtitle={gamesCopy.subtitle} />
      <View style={styles.list}>
        {ORDER.map((type) => (
          <Pressable key={type} onPress={() => router.push(GAME_ROUTES[type] as never)}>
            <PencilCard seedKey={`game-${type}`} style={styles.card}>
              <PencilText variant="label">{gamesCopy.list[type].title}</PencilText>
              <PencilText variant="small">{gamesCopy.list[type].blurb}</PencilText>
            </PencilCard>
          </Pressable>
        ))}
      </View>
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {},
});
