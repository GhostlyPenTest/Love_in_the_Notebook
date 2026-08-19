import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { pairingCopy } from '@/constants/copy';
import { paperColors, spacing } from '@/constants/theme';
import {
  CoupleAlreadyFullError,
  InvalidPairingCodeError,
  createCouple,
  joinCoupleWithCode,
  updateUserProfile,
} from '@/lib/firebase/auth';
import { useCouple } from '@/lib/couple/CoupleProvider';
import type { DoodleSetName } from '@/components/doodles/doodleSets';

import { PaperBackground } from '@/components/paper/PaperBackground';
import { PencilButton } from '@/components/paper/PencilButton';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';
import { NotebookHeader } from '@/components/paper/NotebookHeader';
import { DoodleLayer } from '@/components/doodles/DoodleLayer';

type Step = 'name' | 'choose' | 'create-wait' | 'join-form';

export default function PairingScreen() {
  const { loading, userId, profile, isPaired } = useCouple();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [doodleSet, setDoodleSet] = useState<DoodleSetName>('floral');
  const [code, setCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Seeding local draft state from an async-loaded external profile the first time it
    // arrives -- the canonical case this rule is conservative about.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (profile?.displayName) {
      setName(profile.displayName);
      setDoodleSet(profile.doodleSet);
      setStep('choose');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile?.displayName, profile?.doodleSet]);

  if (loading) return null;
  if (isPaired) return <Redirect href="/(notebook)/status" />;

  async function confirmName() {
    if (!userId || !name.trim()) return;
    setBusy(true);
    try {
      await updateUserProfile(userId, { displayName: name.trim(), doodleSet });
      setStep('choose');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const { code: newCode } = await createCouple(userId);
      setCode(newCode);
      setStep('create-wait');
    } catch {
      setError(pairingCopy.invalidCode);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!userId || !joinInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await joinCoupleWithCode(userId, joinInput);
      // useCouple's onSnapshot listeners pick up the new coupleId and
      // isPaired flips true, which redirects at the top of this component.
    } catch (err) {
      if (err instanceof InvalidPairingCodeError) {
        setError(pairingCopy.invalidCode);
      } else if (err instanceof CoupleAlreadyFullError) {
        setError(pairingCopy.invalidCode);
      } else {
        setError(pairingCopy.invalidCode);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <PaperBackground>
      <DoodleLayer count={3} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'name' && (
          <View style={styles.block}>
            <NotebookHeader title={pairingCopy.welcomeTitle} subtitle={pairingCopy.welcomeBody} />
            <PencilText variant="label" style={styles.fieldLabel}>
              {pairingCopy.displayNamePrompt}
            </PencilText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={pairingCopy.displayNamePlaceholder}
              placeholderTextColor={paperColors.pencilFaint}
              style={styles.input}
              autoCapitalize="words"
            />
            <View style={styles.doodleRow}>
              {(['floral', 'arrows'] as DoodleSetName[]).map((set) => (
                <PencilButton
                  key={set}
                  label={set === 'floral' ? 'floral doodles' : 'arrow doodles'}
                  variant={doodleSet === set ? 'primary' : 'secondary'}
                  accentColor={set === 'floral' ? paperColors.inkPink : paperColors.inkBlue}
                  onPress={() => setDoodleSet(set)}
                  style={styles.doodleButton}
                />
              ))}
            </View>
            <PencilButton
              label={busy ? '...' : "let's go"}
              onPress={confirmName}
              disabled={!name.trim() || busy}
              style={styles.mainButton}
            />
          </View>
        )}

        {step === 'choose' && (
          <View style={styles.block}>
            <NotebookHeader title={pairingCopy.welcomeTitle} subtitle={pairingCopy.welcomeBody} />
            {error && (
              <PencilText variant="small" color={paperColors.danger} style={styles.error}>
                {error}
              </PencilText>
            )}
            <PencilButton
              label={pairingCopy.createButton}
              onPress={handleCreate}
              disabled={busy}
              style={styles.mainButton}
            />
            <PencilButton
              label={pairingCopy.joinButton}
              variant="secondary"
              onPress={() => setStep('join-form')}
              disabled={busy}
              style={styles.mainButton}
            />
          </View>
        )}

        {step === 'create-wait' && (
          <View style={styles.block}>
            <NotebookHeader title={pairingCopy.yourCodeTitle} />
            <PencilCard seedKey="pairing-code" style={styles.codeCard}>
              <PencilText variant="title" style={styles.codeText}>
                {code}
              </PencilText>
            </PencilCard>
            <PencilText variant="small" style={styles.centerText}>
              {pairingCopy.yourCodeBody}
            </PencilText>
            <PencilButton
              label="copy code"
              variant="secondary"
              onPress={() => Clipboard.setStringAsync(code)}
              style={styles.mainButton}
            />
            <PencilText variant="label" style={styles.waitingText}>
              {pairingCopy.waitingForPartner}
            </PencilText>
          </View>
        )}

        {step === 'join-form' && (
          <View style={styles.block}>
            <NotebookHeader title={pairingCopy.enterCodePrompt} />
            {error && (
              <PencilText variant="small" color={paperColors.danger} style={styles.error}>
                {error}
              </PencilText>
            )}
            <TextInput
              value={joinInput}
              onChangeText={(t) => setJoinInput(t.toUpperCase())}
              placeholder={pairingCopy.codeInputPlaceholder}
              placeholderTextColor={paperColors.pencilFaint}
              style={[styles.input, styles.codeInput]}
              autoCapitalize="characters"
              maxLength={6}
            />
            <PencilButton
              label={busy ? '...' : pairingCopy.joinButtonSubmit}
              onPress={handleJoin}
              disabled={!joinInput.trim() || busy}
              style={styles.mainButton}
            />
          </View>
        )}
      </ScrollView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  block: {
    gap: spacing.sm,
  },
  fieldLabel: {
    marginTop: spacing.sm,
  },
  input: {
    borderBottomWidth: 1.5,
    borderColor: paperColors.pencilSoft,
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 18,
    color: paperColors.pencil,
    paddingVertical: spacing.sm,
  },
  codeInput: {
    fontSize: 28,
    letterSpacing: 6,
    textAlign: 'center',
  },
  doodleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  doodleButton: {
    flex: 1,
  },
  mainButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  codeCard: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  codeText: {
    letterSpacing: 8,
  },
  centerText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  waitingText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  error: {
    marginTop: spacing.xs,
  },
});
