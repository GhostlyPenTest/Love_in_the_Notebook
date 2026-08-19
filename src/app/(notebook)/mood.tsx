import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { moodCopy, notificationsCopy } from '@/constants/copy';
import { paths } from '@/constants/firestorePaths';
import { paperColors, spacing } from '@/constants/theme';
import { sendPushNotification } from '@/lib/push/notifications';
import { useMutualReveal } from '@/lib/reveal/useMutualReveal';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useCouple } from '@/lib/couple/CoupleProvider';
import type { MoodContent, MoodIcon } from '@/types/models';

import { MutualReveal } from '@/components/reveal/MutualReveal';
import { NotebookHeader } from '@/components/paper/NotebookHeader';
import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';

const MOOD_ICONS: { key: MoodIcon; emoji: string }[] = [
  { key: 'sunny', emoji: '☀️' },
  { key: 'foggy', emoji: '🌫️' },
  { key: 'stormy', emoji: '⛈️' },
  { key: 'calm', emoji: '🌙' },
];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MoodScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();
  const date = useMemo(() => todayKey(), []);
  const metaPath = coupleId ? paths.moodEntry(coupleId, date) : '';

  const reveal = useMutualReveal<MoodContent>({ metaPath, coupleId: coupleId ?? '', entryKey: date, userId, partnerId });

  const [icon, setIcon] = useState<MoodIcon | null>(null);
  const [note, setNote] = useState('');

  async function handleSubmit() {
    if (!icon || !coupleId) return;
    await reveal.submit({ icon, note: note.trim() || undefined });
    recordSparkEvent(coupleId, 'mood_entered');
    if (partnerProfile?.expoPushToken) {
      sendPushNotification({
        to: partnerProfile.expoPushToken,
        title: notificationsCopy.moodPromptTitle,
        body: reveal.partnerHasSubmitted ? notificationsCopy.revealReady : notificationsCopy.newActivityTitle,
      });
    }
  }

  return (
    <NotebookScreen>
      <NotebookHeader title={moodCopy.screenTitle} subtitle={moodCopy.prompt} />

      <MutualReveal
        reveal={reveal}
        copy={{
          lockedTitle: moodCopy.lockedTitle,
          lockedBody: moodCopy.lockedBody,
          revealTitle: moodCopy.revealTitle,
          revealSubtitle: moodCopy.revealSubtitle,
        }}
        renderCompose={() => (
          <View>
            <PencilText variant="small">{moodCopy.subtitle}</PencilText>
            <View style={styles.iconRow}>
              {MOOD_ICONS.map((m) => (
                <PencilButton
                  key={m.key}
                  label={`${m.emoji} ${moodCopy.icons[m.key]}`}
                  variant={icon === m.key ? 'primary' : 'secondary'}
                  onPress={() => setIcon(m.key)}
                  style={styles.iconButton}
                />
              ))}
            </View>
            <PencilText variant="label" style={styles.noteLabel}>
              {moodCopy.noteLabel}
            </PencilText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={moodCopy.notePlaceholder}
              placeholderTextColor={paperColors.pencilFaint}
              style={styles.input}
              multiline
              maxLength={200}
            />
            <PencilButton
              label={moodCopy.submitButton}
              onPress={handleSubmit}
              disabled={!icon}
              style={styles.submitButton}
            />
          </View>
        )}
        renderRevealed={(mine, theirs) => (
          <View style={styles.revealRow}>
            <PencilCard seedKey="mood-mine" style={styles.revealCard}>
              <PencilText variant="small">you</PencilText>
              <PencilText variant="title">{MOOD_ICONS.find((m) => m.key === mine.icon)?.emoji}</PencilText>
              <PencilText variant="label">{moodCopy.icons[mine.icon]}</PencilText>
              {mine.note ? <PencilText variant="body">{mine.note}</PencilText> : null}
            </PencilCard>
            <PencilCard seedKey="mood-theirs" style={styles.revealCard}>
              <PencilText variant="small">{partnerProfile?.displayName || 'them'}</PencilText>
              {theirs ? (
                <>
                  <PencilText variant="title">{MOOD_ICONS.find((m) => m.key === theirs.icon)?.emoji}</PencilText>
                  <PencilText variant="label">{moodCopy.icons[theirs.icon]}</PencilText>
                  {theirs.note ? <PencilText variant="body">{theirs.note}</PencilText> : null}
                </>
              ) : (
                <PencilText variant="small">{moodCopy.lockedBody}</PencilText>
              )}
            </PencilCard>
          </View>
        )}
      />
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  iconButton: {
    minWidth: '45%',
  },
  noteLabel: {
    marginTop: spacing.lg,
  },
  input: {
    borderWidth: 1.5,
    borderColor: paperColors.pencilSoft,
    borderRadius: 8,
    fontFamily: 'Kalam_700Bold',
    fontSize: 20,
    color: paperColors.pencil,
    padding: spacing.sm,
    marginTop: spacing.xs,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  revealRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  revealCard: {
    flex: 1,
    alignItems: 'center',
  },
});
