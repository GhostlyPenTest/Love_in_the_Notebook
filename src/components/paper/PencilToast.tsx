import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { paperColors, radii, spacing } from '@/constants/theme';

import { PencilText } from './PencilText';

/** Small floating confirmation pill, driven by lib/ui/useToast. */
export function PencilToast({ message }: { message: string | null }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(message ? 1 : 0, { duration: 220 });
  }, [message, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, animatedStyle]} pointerEvents="none">
      <PencilText variant="label" color={paperColors.page}>
        {message}
      </PencilText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: paperColors.pencil,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
});
