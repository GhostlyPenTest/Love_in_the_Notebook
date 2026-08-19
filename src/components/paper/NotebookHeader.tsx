import { useId, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { paperColors, spacing } from '@/constants/theme';
import { hashSeed, roughUnderlinePath } from '@/lib/paper/rough';

import { PencilText } from './PencilText';

/** Page header used at the top of every notebook screen: title + hand-drawn underline. */
export function NotebookHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [width, setWidth] = useState(0);
  const reactId = useId();
  const seed = useMemo(() => hashSeed(title + reactId), [title, reactId]);

  const handleLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const path = useMemo(() => (width ? roughUnderlinePath(width, seed) : null), [width, seed]);

  return (
    <View style={styles.container}>
      <PencilText variant="title">{title}</PencilText>
      <View style={styles.underline} onLayout={handleLayout}>
        {width > 0 && path && (
          <Svg width={width} height={8}>
            <Path d={path} stroke={paperColors.marginRed} strokeWidth={2} fill="none" transform={`translate(0, 4)`} />
          </Svg>
        )}
      </View>
      {subtitle ? (
        <PencilText variant="small" style={styles.subtitle}>
          {subtitle}
        </PencilText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  underline: {
    height: 8,
    marginTop: 2,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
