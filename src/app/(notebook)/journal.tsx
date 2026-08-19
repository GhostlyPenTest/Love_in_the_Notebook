import { getDoc, getDocs, limit as fbLimit, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { journalCopy, notificationsCopy } from '@/constants/copy';
import { paths } from '@/constants/firestorePaths';
import { paperColors, spacing } from '@/constants/theme';
import { docRef, collectionRef } from '@/lib/firebase/firestore';
import { sendPushNotification } from '@/lib/push/notifications';
import { useMutualReveal } from '@/lib/reveal/useMutualReveal';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useCouple } from '@/lib/couple/CoupleProvider';
import type { JournalContent, JournalEntry, MutualSubmission } from '@/types/models';

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

interface HistoryRow {
  date: string;
  mine: string | null;
  theirs: string | null;
}

function useJournalHistory(coupleId: string | null, userId: string | null, partnerId: string | null, currentDate: string) {
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (!coupleId || !userId) return;
    let cancelled = false;

    async function load() {
      const q = query(collectionRef<JournalEntry>(paths.journalEntries(coupleId!)), orderBy('key', 'desc'), fbLimit(14));
      const snap = await getDocs(q);
      const revealed = snap.docs.map((d) => d.data()).filter((e) => e.revealedAt && e.key !== currentDate);

      const results = await Promise.all(
        revealed.map(async (entry) => {
          const metaPath = paths.journalEntry(coupleId!, entry.key);
          const [mineSnap, theirsSnap] = await Promise.all([
            getDoc(docRef<MutualSubmission<JournalContent>>(paths.submissionOf(metaPath, userId!))),
            partnerId
              ? getDoc(docRef<MutualSubmission<JournalContent>>(paths.submissionOf(metaPath, partnerId)))
              : Promise.resolve(null),
          ]);
          return {
            date: entry.key,
            mine: mineSnap.exists() ? mineSnap.data().content.text : null,
            theirs: theirsSnap?.exists() ? theirsSnap.data().content.text : null,
          };
        })
      );

      if (!cancelled) setRows(results);
    }

    load().catch(() => {
      if (!cancelled) setRows([]);
    });
    return () => {
      cancelled = true;
    };
  }, [coupleId, userId, partnerId, currentDate]);

  return rows;
}

export default function JournalScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();
  const date = useMemo(() => todayKey(), []);
  const metaPath = coupleId ? paths.journalEntry(coupleId, date) : '';

  const reveal = useMutualReveal<JournalContent>({ metaPath, coupleId: coupleId ?? '', entryKey: date, userId, partnerId });
  const history = useJournalHistory(coupleId, userId, partnerId, date);

  const [text, setText] = useState('');

  async function handleSubmit() {
    if (!text.trim() || !coupleId) return;
    await reveal.submit({ text: text.trim() });
    recordSparkEvent(coupleId, 'journal_completed');
    if (partnerProfile?.expoPushToken) {
      sendPushNotification({
        to: partnerProfile.expoPushToken,
        title: notificationsCopy.journalPromptTitle,
        body: reveal.partnerHasSubmitted ? notificationsCopy.revealReady : notificationsCopy.newActivityTitle,
      });
    }
  }

  return (
    <NotebookScreen>
      <NotebookHeader title={journalCopy.screenTitle} subtitle={journalCopy.prompt} />

      <MutualReveal
        reveal={reveal}
        copy={{
          lockedTitle: journalCopy.lockedTitle,
          lockedBody: journalCopy.lockedBody,
          revealTitle: journalCopy.revealTitle,
          revealSubtitle: journalCopy.revealSubtitle,
        }}
        renderCompose={() => (
          <View>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={journalCopy.textPlaceholder}
              placeholderTextColor={paperColors.pencilFaint}
              style={styles.input}
              multiline
              maxLength={1000}
            />
            <PencilButton label={journalCopy.submitButton} onPress={handleSubmit} disabled={!text.trim()} style={styles.submitButton} />
          </View>
        )}
        renderRevealed={(mine, theirs) => (
          <View style={styles.revealCol}>
            <PencilCard seedKey="journal-mine" style={styles.revealCard}>
              <PencilText variant="small">you</PencilText>
              <PencilText variant="body">{mine.text}</PencilText>
            </PencilCard>
            <PencilCard seedKey="journal-theirs" style={styles.revealCard}>
              <PencilText variant="small">{partnerProfile?.displayName || 'them'}</PencilText>
              <PencilText variant="body">{theirs?.text ?? journalCopy.lockedBody}</PencilText>
            </PencilCard>
          </View>
        )}
      />

      <PencilText variant="subtitle" style={styles.historyTitle}>
        {journalCopy.historyTitle}
      </PencilText>
      {history.length === 0 ? (
        <PencilText variant="small">{journalCopy.emptyHistoryBody}</PencilText>
      ) : (
        history.map((row) => (
          <PencilCard key={row.date} seedKey={`history-${row.date}`} style={styles.historyCard}>
            <PencilText variant="label">{row.date}</PencilText>
            <PencilText variant="small" style={styles.historyLine}>
              you: {row.mine ?? '—'}
            </PencilText>
            <PencilText variant="small" style={styles.historyLine}>
              {partnerProfile?.displayName || 'them'}: {row.theirs ?? '—'}
            </PencilText>
          </PencilCard>
        ))
      )}
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: paperColors.pencilSoft,
    borderRadius: 8,
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 20,
    color: paperColors.pencil,
    padding: spacing.sm,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  revealCol: {
    gap: spacing.sm,
  },
  revealCard: {},
  historyTitle: {
    marginTop: spacing.xl,
  },
  historyCard: {
    marginTop: spacing.sm,
  },
  historyLine: {
    marginTop: 2,
  },
});
