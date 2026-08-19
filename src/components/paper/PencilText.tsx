import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { fonts, paperColors } from '@/constants/theme';

type Variant = 'title' | 'subtitle' | 'label' | 'body' | 'small' | 'code';

interface PencilTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  children: ReactNode;
}

/** Text with the notebook's two handwriting fonts baked in per variant. */
export function PencilText({ variant = 'body', color, style, children, ...rest }: PencilTextProps) {
  return (
    <Text style={[styles[variant], color ? { color } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

// Handwriting fonts have a lower x-height and thinner strokes than a system
// sans at the same nominal size, so they read noticeably smaller in
// practice -- sized up across the board to actually be
// large and easy to read on a phone, not just technically legible.
const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.hand,
    fontSize: 42,
    lineHeight: 46,
    color: paperColors.pencil,
  },
  subtitle: {
    fontFamily: fonts.hand,
    fontSize: 28,
    lineHeight: 32,
    color: paperColors.pencil,
  },
  label: {
    fontFamily: fonts.hand,
    fontSize: 23,
    lineHeight: 27,
    color: paperColors.pencil,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 21,
    lineHeight: 29,
    color: paperColors.pencil,
  },
  small: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 23,
    color: paperColors.pencilSoft,
  },
  code: {
    fontFamily: fonts.system,
    fontSize: 19,
    letterSpacing: 2,
    color: paperColors.pencil,
  },
});
