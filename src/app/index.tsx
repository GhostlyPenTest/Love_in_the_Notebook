import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { commonCopy } from '@/constants/copy';
import { useCouple } from '@/lib/couple/CoupleProvider';

import { PaperBackground } from '@/components/paper/PaperBackground';
import { PencilText } from '@/components/paper/PencilText';

/** Routing gate: send a fresh device to pairing, a paired couple straight into the notebook. */
export default function Index() {
  const { loading, isPaired } = useCouple();

  if (loading) {
    return (
      <PaperBackground>
        <View style={styles.center}>
          <PencilText variant="label">{commonCopy.loading}</PencilText>
        </View>
      </PaperBackground>
    );
  }

  return <Redirect href={isPaired ? '/(notebook)/status' : '/pairing'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
