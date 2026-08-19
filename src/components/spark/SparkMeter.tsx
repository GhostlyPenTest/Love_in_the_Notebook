import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { paperColors, spacing } from '@/constants/theme';
import { spark as sparkCopy } from '@/constants/copy';
import { useSparkPoints } from '@/lib/spark/useSparkPoints';

import { PencilText } from '@/components/paper/PencilText';

/**
 * V2 seed visual: a tiny plot with a sprite that changes at point
 * thresholds. Deliberately small and un-gamey in V1 -- just enough to prove
 * event -> increment -> threshold -> render works end to end before V2
 * builds real game logic on top of it.
 */
function PlotSprite({ level }: { level: number }) {
  // stage 0: bare dirt. 1: sprout. 2: small plant. 3: budding flower.
  // 4: bloomed flower. 5: flower + a second bud (a little "settlement" tease).
  return (
    <Svg width={72} height={56} viewBox="0 0 72 56">
      {/* ground */}
      <Line x1={6} y1={46} x2={66} y2={46} stroke={paperColors.pencilSoft} strokeWidth={1.5} strokeLinecap="round" />

      {level >= 1 && (
        <Path d="M36 46 C 36 40, 34 36, 36 30" stroke={paperColors.good} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {level >= 2 && (
        <Path
          d="M36 38 C 30 36, 28 32, 30 28 M36 36 C 42 34, 44 30, 42 26"
          stroke={paperColors.good}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {level >= 3 && <Circle cx={36} cy={26} r={4} fill={paperColors.pencilFaint} stroke={paperColors.pencil} strokeWidth={1.2} />}
      {level >= 4 && (
        <>
          <Circle cx={36} cy={22} r={5} fill={paperColors.inkPinkSoft} stroke={paperColors.inkPink} strokeWidth={1.2} />
          <Circle cx={30} cy={26} r={3.5} fill={paperColors.inkPinkSoft} stroke={paperColors.inkPink} strokeWidth={1} />
          <Circle cx={42} cy={26} r={3.5} fill={paperColors.inkPinkSoft} stroke={paperColors.inkPink} strokeWidth={1} />
        </>
      )}
      {level >= 5 && (
        <>
          <Path d="M52 46 C 52 42, 50 39, 52 35" stroke={paperColors.good} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Circle cx={52} cy={33} r={3} fill={paperColors.inkBlueSoft} stroke={paperColors.inkBlue} strokeWidth={1} />
        </>
      )}
    </Svg>
  );
}

export function SparkMeter({ coupleId }: { coupleId: string | null }) {
  const { total, level, nextThreshold } = useSparkPoints(coupleId);

  return (
    <View style={styles.row}>
      <PlotSprite level={level} />
      <View style={styles.labelCol}>
        <PencilText variant="small">{sparkCopy.meterLabel}</PencilText>
        <PencilText variant="label">
          {total} {nextThreshold !== null ? `(next at ${nextThreshold})` : '(maxed out!)'}
        </PencilText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelCol: {
    gap: 2,
  },
});
