import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { commonCopy } from '@/constants/copy';
import { spacing } from '@/constants/theme';
import type { UseMutualRevealResult } from '@/lib/reveal/useMutualReveal';

import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';

interface RevealCopy {
  lockedTitle: string;
  lockedBody: string;
  revealTitle: string;
  revealSubtitle?: string;
}

interface MutualRevealProps<TContent> {
  reveal: UseMutualRevealResult<TContent>;
  copy: RevealCopy;
  /** Shown before this user has submitted. */
  renderCompose: () => ReactNode;
  /** Shown once both sides are in. */
  renderRevealed: (mine: TContent, theirs: TContent | null) => ReactNode;
}

/**
 * Generic Mutual Reveal shell: submit -> locked -> both in -> reveal.
 * Typed over content, keyed by whatever meta path useMutualReveal was given.
 * Powers Mood Weather, the Journal, and Daily Duel Trivia.
 */
export function MutualReveal<TContent>({ reveal, copy, renderCompose, renderRevealed }: MutualRevealProps<TContent>) {
  if (reveal.loading) {
    return (
      <View style={styles.center}>
        <PencilText variant="small">{commonCopy.loading}</PencilText>
      </View>
    );
  }

  if (!reveal.hasSubmitted) {
    return <>{renderCompose()}</>;
  }

  if (!reveal.isRevealed || reveal.mySubmission === null) {
    return (
      <PencilCard seedKey="mutual-reveal-locked" style={styles.card}>
        <PencilText variant="label">{copy.lockedTitle}</PencilText>
        <PencilText variant="body" style={styles.lockedBody}>
          {copy.lockedBody}
        </PencilText>
      </PencilCard>
    );
  }

  return (
    <View>
      <View style={styles.revealHeader}>
        <PencilText variant="label">{copy.revealTitle}</PencilText>
        {copy.revealSubtitle ? <PencilText variant="small">{copy.revealSubtitle}</PencilText> : null}
      </View>
      {renderRevealed(reveal.mySubmission, reveal.partnerSubmission)}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  card: {
    marginTop: spacing.sm,
  },
  lockedBody: {
    marginTop: spacing.xs,
  },
  revealHeader: {
    marginBottom: spacing.sm,
  },
});
