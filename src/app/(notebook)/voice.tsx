import { StyleSheet, View } from 'react-native';

import { voiceNotesCopy } from '@/constants/copy';
import { spacing } from '@/constants/theme';

import { NotebookHeader } from '@/components/paper/NotebookHeader';
import { NotebookScreen } from '@/components/paper/NotebookScreen';
import { PencilCard } from '@/components/paper/PencilCard';
import { PencilText } from '@/components/paper/PencilText';

/**
 * Deferred to V2: dead-drop voice notes need file storage, and Firebase
 * Storage now requires the Blaze plan. Data model (types/models.ts VoiceNote)
 * and this nav slot stay in place so V2 just has to wire the upload flow in,
 * not rebuild the feature -- see docs/original-prompt.md.
 */
export default function VoiceNotesScreen() {
  return (
    <NotebookScreen>
      <NotebookHeader title={voiceNotesCopy.screenTitle} subtitle={voiceNotesCopy.subtitle} />
      <View style={styles.wrap}>
        <PencilCard seedKey="voice-coming-soon">
          <PencilText variant="label">comin soon...</PencilText>
          <PencilText variant="body" style={styles.body}>
            this one needs cloud file storage turned on, which we&rsquo;re holding off on for now.
            landing in v2 once that&rsquo;s flipped on.
          </PencilText>
        </PencilCard>
      </View>
    </NotebookScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
  },
  body: {
    marginTop: spacing.sm,
  },
});
