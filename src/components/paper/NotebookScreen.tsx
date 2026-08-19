import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/constants/theme';
import { DoodleLayer } from '@/components/doodles/DoodleLayer';

import { PaperBackground } from './PaperBackground';

/** Shared per-screen shell: paper background + ambient doodles + safe area + scroll. */
export function NotebookScreen({
  children,
  scroll = true,
  doodleCount = 3,
}: {
  children: ReactNode;
  scroll?: boolean;
  doodleCount?: number;
}) {
  return (
    <PaperBackground>
      <DoodleLayer count={doodleCount} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
