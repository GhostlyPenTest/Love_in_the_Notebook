import { addDoc, collection, limit as fbLimit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { notificationsCopy, statusSignalsCopy } from '@/constants/copy';
import { paths } from '@/constants/firestorePaths';
import { paperColors, spacing } from '@/constants/theme';
import { db } from '@/lib/firebase/init';
import { collectionRef, docRef } from '@/lib/firebase/firestore';
import { sendPushNotification } from '@/lib/push/notifications';
import { recordSparkEvent } from '@/lib/spark/useSparkPoints';
import { useToast } from '@/lib/ui/useToast';
import { useCouple } from '@/lib/couple/CoupleProvider';
import type { Signal, SignalType, StatusEntry } from '@/types/models';

import { NotebookHeader } from '@/components/paper/NotebookHeader';
import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';
import { PencilToast } from '@/components/paper/PencilToast';
import { SparkMeter } from '@/components/spark/SparkMeter';

const SIGNAL_TYPES: SignalType[] = ['thinking', 'bad_day', 'miss_you', 'good_day'];

function useStatus(userId: string | null) {
  const [status, setStatus] = useState<StatusEntry | null>(null);
  useEffect(() => {
    if (!userId) return;
    return onSnapshot(docRef<StatusEntry>(paths.status(userId)), (snap) =>
      setStatus(snap.exists() ? snap.data() : null)
    );
  }, [userId]);
  return status;
}

export default function StatusScreen() {
  const { userId, coupleId, partnerId, partnerProfile } = useCouple();
  const myStatus = useStatus(userId);
  const partnerStatus = useStatus(partnerId);
  const { message, show } = useToast();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collectionRef<Signal>(paths.signals(coupleId)), orderBy('createdAt', 'desc'), fbLimit(10));
    return onSnapshot(q, (snap) => setSignals(snap.docs.map((d) => d.data())));
  }, [coupleId]);

  async function saveStatus() {
    if (!userId) return;
    await setDoc(docRef<StatusEntry>(paths.status(userId)), {
      userId,
      text: draft.trim() || statusSignalsCopy.statusPromptEmpty,
      updatedAt: Date.now(),
    });
    setEditing(false);
  }

  async function sendSignal(type: SignalType) {
    if (!userId || !coupleId) return;
    // This only ever runs from a PencilButton onPress below, never during render -- the
    // purity check can't see that through a plain nested async function.
    // eslint-disable-next-line react-hooks/purity
    const sentAt = Date.now();
    await addDoc(collection(db, paths.signals(coupleId)), {
      coupleId,
      fromUserId: userId,
      type,
      createdAt: sentAt,
      seenAt: null,
    } satisfies Omit<Signal, 'id'>);

    recordSparkEvent(coupleId, 'signal_sent');
    show(statusSignalsCopy.signalSentToast);

    if (partnerProfile?.expoPushToken) {
      sendPushNotification({
        to: partnerProfile.expoPushToken,
        title: notificationsCopy.signalReceived(statusSignalsCopy.signalLabels[type]),
        body: appName(),
      });
    }
  }

  function appName() {
    return 'love in the notebook';
  }

  return (
    <NotebookScreen>
      <NotebookHeader title={statusSignalsCopy.screenTitle} />
      <View style={styles.sparkWrap}>
        <SparkMeter coupleId={coupleId} />
      </View>

      <PencilText variant="subtitle">{statusSignalsCopy.statusSectionTitle}</PencilText>

      <PencilCard seedKey="my-status" style={styles.card}>
        <PencilText variant="small">you</PencilText>
        {editing ? (
          <View>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={statusSignalsCopy.statusPlaceholder}
              placeholderTextColor={paperColors.pencilFaint}
              style={styles.input}
              autoFocus
              maxLength={80}
            />
            <PencilButton label="save" onPress={saveStatus} style={styles.saveButton} />
          </View>
        ) : (
          <PencilText
            variant="body"
            onPress={() => {
              setDraft(myStatus?.text ?? '');
              setEditing(true);
            }}
          >
            {myStatus?.text ?? statusSignalsCopy.statusPromptEmpty}
          </PencilText>
        )}
      </PencilCard>

      <PencilCard seedKey="partner-status" style={styles.card}>
        <PencilText variant="small">
          {statusSignalsCopy.statusPartnerLabel(partnerProfile?.displayName || 'them')}
        </PencilText>
        <PencilText variant="body">{partnerStatus?.text ?? statusSignalsCopy.statusPartnerEmpty}</PencilText>
      </PencilCard>

      <PencilText variant="subtitle" style={styles.sectionSpacing}>
        {statusSignalsCopy.signalsSectionTitle}
      </PencilText>
      <PencilText variant="small">{statusSignalsCopy.signalsSubtitle}</PencilText>

      <View style={styles.signalGrid}>
        {SIGNAL_TYPES.map((type) => (
          <PencilButton
            key={type}
            label={statusSignalsCopy.signalLabels[type]}
            variant="secondary"
            accentColor={paperColors.inkPink}
            onPress={() => sendSignal(type)}
            style={styles.signalButton}
          />
        ))}
      </View>

      <PencilText variant="subtitle" style={styles.sectionSpacing}>
        {statusSignalsCopy.signalsFeedTitle}
      </PencilText>
      {signals.filter((s) => s.fromUserId === partnerId).length === 0 ? (
        <PencilText variant="small">{statusSignalsCopy.signalsFeedEmpty}</PencilText>
      ) : (
        <FlatList
          data={signals.filter((s) => s.fromUserId === partnerId)}
          keyExtractor={(item, i) => `${item.createdAt}-${i}`}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <PencilText variant="body" style={styles.feedItem}>
              {statusSignalsCopy.signalLabels[item.type]}
            </PencilText>
          )}
        />
      )}

      <PencilToast message={message} />
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  sparkWrap: {
    marginBottom: spacing.md,
  },
  card: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    borderBottomWidth: 1.5,
    borderColor: paperColors.pencilSoft,
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 17,
    color: paperColors.pencil,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  signalButton: {
    minWidth: '45%',
  },
  feedItem: {
    paddingVertical: spacing.xs,
  },
});
