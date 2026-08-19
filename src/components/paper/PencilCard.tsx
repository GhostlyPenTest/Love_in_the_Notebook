import { useId, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { paperColors, radii, spacing } from '@/constants/theme';
import { hashSeed, roughRoundedRectPath } from '@/lib/paper/rough';

interface PencilCardProps extends ViewProps {
  /** Stable string so the same card doesn't re-jitter its border on every render. */
  seedKey?: string;
  borderColor?: string;
  fill?: string;
  padding?: number;
}

/** A card whose border is a seeded hand-drawn wobble instead of a clean vector rect. */
export function PencilCard({
  seedKey = 'card',
  borderColor = paperColors.pencil,
  fill = paperColors.page,
  padding = spacing.md,
  style,
  children,
  onLayout,
  ...rest
}: PencilCardProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const reactId = useId();
  const seed = useMemo(() => hashSeed(seedKey + reactId), [seedKey, reactId]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    onLayout?.(e);
  };

  const path = useMemo(
    () => (size ? roughRoundedRectPath(size.width, size.height, radii.md, seed) : null),
    [size, seed]
  );

  return (
    <View style={[styles.container, { padding }, style]} onLayout={handleLayout} {...rest}>
      {size && path && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
          pointerEvents="none"
        >
          <Path d={path} fill={fill} stroke={borderColor} strokeWidth={1.75} />
        </Svg>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    position: 'relative',
  },
});
