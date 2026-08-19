import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { paperColors, ruledPaper } from '@/constants/theme';

/**
 * Every-screen background: off-white paper, faint blue ruled lines, a red
 * margin line. Ruled/margin lines stay geometrically clean on purpose --
 * on real notebook paper those are machine-printed, not hand-drawn, so
 * pencil wobble belongs on the doodles and UI chrome layered on top, not here.
 */
export function PaperBackground({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern
            id="ruleLines"
            patternUnits="userSpaceOnUse"
            width={4}
            height={ruledPaper.lineSpacing}
          >
            <Line
              x1={0}
              y1={ruledPaper.lineSpacing - 0.5}
              x2={4}
              y2={ruledPaper.lineSpacing - 0.5}
              stroke={ruledPaper.lineColor}
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={paperColors.page} />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#ruleLines)" />
        <Line
          x1={ruledPaper.marginInset}
          y1={0}
          x2={ruledPaper.marginInset}
          y2="100%"
          stroke={ruledPaper.marginColor}
          strokeWidth={1.5}
        />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paperColors.page,
  },
});
