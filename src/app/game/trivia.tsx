import { runTransaction } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { notificationsCopy, triviaCopy } from '@/constants/copy';
import { paths } from '@/constants/firestorePaths';
import { paperColors, spacing } from '@/constants/theme';
import { docRef } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/init';
import { getQuestionForDate } from '@/lib/games/trivia';
import { sendPushNotification } from '@/lib/push/notifications';
import { useMutualReveal } from '@/lib/reveal/useMutualReveal';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useCouple } from '@/lib/couple/CoupleProvider';
import type { GameSession } from '@/types/models';

import { MutualReveal } from '@/components/reveal/MutualReveal';
import { NotebookHeader } from '@/components/paper/NotebookHeader';
import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface TriviaAnswer {
  answerIndex: number;
}

/**
 * gameSessions/{coupleId}/sessions/{sessionId} 'create' requires playerIds
 * (see firestore.rules), which useMutualReveal's meta writes don't set --
 * it only knows submittedBy/revealedAt. So this pre-creates the session doc
 * with playerIds once, turning every later Mutual Reveal write into an
 * 'update' (no playerIds requirement) instead of a 'create'.
 */
function useEnsureTriviaSession(coupleId: string | null, userId: string | null, partnerId: string | null, sessionId: string) {
  useEffect(() => {
    if (!coupleId || !userId || !partnerId) return;
    const ref = docRef<GameSession<Record<string, never>>>(paths.gameSession(coupleId, sessionId));
    runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return;
      tx.set(ref, {
        id: sessionId,
        coupleId,
        type: 'trivia',
        state: {},
        currentTurn: null,
        playerIds: [userId, partnerId].sort(),
        status: 'active',
        winnerId: null,
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        submittedBy: {},
        revealedAt: null,
      });
    }).catch((err) => console.warn('[trivia] failed to ensure session', err));
  }, [coupleId, userId, partnerId, sessionId]);
}

export default function TriviaScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();
  const date = useMemo(() => todayKey(), []);
  const sessionId = `trivia-${date}`;
  const question = useMemo(() => getQuestionForDate(date), [date]);

  useEnsureTriviaSession(coupleId, userId, partnerId, sessionId);

  const metaPath = coupleId ? paths.gameSession(coupleId, sessionId) : '';
  const reveal = useMutualReveal<TriviaAnswer>({ metaPath, coupleId: coupleId ?? '', entryKey: sessionId, userId, partnerId });

  const [selected, setSelected] = useState<number | null>(null);

  async function handleSubmit() {
    if (selected === null || !coupleId) return;
    await reveal.submit({ answerIndex: selected });
    recordSparkEvent(coupleId, 'game_move');
    if (partnerProfile?.expoPushToken) {
      sendPushNotification({
        to: partnerProfile.expoPushToken,
        title: notificationsCopy.gameTurnTitle,
        body: reveal.partnerHasSubmitted ? notificationsCopy.revealReady : triviaCopy.title,
      });
    }
  }

  return (
    <NotebookScreen>
      <NotebookHeader title={triviaCopy.title} subtitle={triviaCopy.subtitle} />

      <MutualReveal
        reveal={reveal}
        copy={{
          lockedTitle: triviaCopy.lockedTitle,
          lockedBody: triviaCopy.lockedBody,
          revealTitle: triviaCopy.revealTitle,
        }}
        renderCompose={() => (
          <View>
            <PencilText variant="label">{question.question}</PencilText>
            <View style={styles.options}>
              {question.options.map((opt, i) => (
                <Pressable key={i} onPress={() => setSelected(i)}>
                  <PencilCard
                    seedKey={`trivia-opt-${i}`}
                    style={[styles.option, selected === i && styles.optionSelected]}
                    fill={selected === i ? paperColors.inkBlueSoft : paperColors.page}
                  >
                    <PencilText variant="body">{opt}</PencilText>
                  </PencilCard>
                </Pressable>
              ))}
            </View>
            <PencilButton label={triviaCopy.submitButton} onPress={handleSubmit} disabled={selected === null} style={styles.submitButton} />
          </View>
        )}
        renderRevealed={(mine, theirs) => {
          const myCorrect = mine.answerIndex === question.correctIndex;
          const theirCorrect = theirs ? theirs.answerIndex === question.correctIndex : null;
          return (
            <View>
              <PencilText variant="label">{question.question}</PencilText>
              <PencilText variant="small" style={styles.answerKey}>
                correct answer: {question.options[question.correctIndex]}
              </PencilText>
              <View style={styles.revealRow}>
                <PencilCard seedKey="trivia-mine" style={styles.revealCard}>
                  <PencilText variant="small">you</PencilText>
                  <PencilText variant="body">{question.options[mine.answerIndex]}</PencilText>
                  <PencilText variant="label" color={myCorrect ? paperColors.good : paperColors.danger}>
                    {myCorrect ? triviaCopy.correctBadge : triviaCopy.incorrectBadge}
                  </PencilText>
                </PencilCard>
                <PencilCard seedKey="trivia-theirs" style={styles.revealCard}>
                  <PencilText variant="small">{partnerProfile?.displayName || 'them'}</PencilText>
                  {theirs ? (
                    <>
                      <PencilText variant="body">{question.options[theirs.answerIndex]}</PencilText>
                      <PencilText variant="label" color={theirCorrect ? paperColors.good : paperColors.danger}>
                        {theirCorrect ? triviaCopy.correctBadge : triviaCopy.incorrectBadge}
                      </PencilText>
                    </>
                  ) : (
                    <PencilText variant="small">{triviaCopy.lockedBody}</PencilText>
                  )}
                </PencilCard>
              </View>
              {theirs && myCorrect && theirCorrect && (
                <PencilText variant="label" style={styles.resultBanner}>
                  {triviaCopy.bothRightTitle}
                </PencilText>
              )}
              {theirs && !myCorrect && !theirCorrect && (
                <PencilText variant="label" style={styles.resultBanner}>
                  {triviaCopy.bothWrongTitle}
                </PencilText>
              )}
              <PencilText variant="small" style={styles.comeBack}>
                {triviaCopy.comeBackTomorrow}
              </PencilText>
            </View>
          );
        }}
      />
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  option: {},
  optionSelected: {},
  submitButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  answerKey: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  revealRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  revealCard: {
    flex: 1,
    alignItems: 'center',
  },
  resultBanner: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  comeBack: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
