import { useId, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { paperColors, radii, spacing } from '@/constants/theme';
import { hashSeed, roughRoundedRectPath } from '@/lib/paper/rough';

import { PencilText } from './PencilText';

type Variant = 'primary' | 'secondary' | 'ghost';

interface PencilButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  accentColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  seedKey?: string;
}

/** Tappable button with a seeded hand-drawn border and a little press-in squish. */
export function PencilButton({
  label,
  onPress,
  variant = 'primary',
  accentColor = paperColors.inkBlue,
  disabled = false,
  style,
  seedKey,
}: PencilButtonProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const reactId = useId();
  const seed = useMemo(() => hashSeed((seedKey ?? label) + reactId), [seedKey, label, reactId]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);

  const path = useMemo(
    () => (size ? roughRoundedRectPath(size.width, size.height, radii.pill, seed, 1.4, 5) : null),
    [size, seed]
  );

  const fill =
    variant === 'primary' ? accentColor : variant === 'secondary' ? paperColors.page : 'transparent';
  const borderColor = disabled ? paperColors.pencilFaint : variant === 'ghost' ? paperColors.pencilSoft : paperColors.pencil;
  const textColor = disabled
    ? paperColors.pencilFaint
    : variant === 'primary'
      ? paperColors.page
      : paperColors.pencil;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      // Reanimated SharedValue mutation via `.value =` is the sanctioned API -- see the
      // same note in components/doodles/DoodleLayer.tsx.
      // eslint-disable-next-line react-hooks/immutability
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 14, stiffness: 300 }))}
      // eslint-disable-next-line react-hooks/immutability
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 220 }))}
      hitSlop={6}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        <View style={styles.wrap} onLayout={handleLayout}>
          {size && path && (
            <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height} pointerEvents="none">
              <Path d={path} fill={fill} stroke={borderColor} strokeWidth={1.75} />
            </Svg>
          )}
          <View style={styles.content}>
            <PencilText variant="label" color={textColor}>
              {label}
            </PencilText>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  content: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
