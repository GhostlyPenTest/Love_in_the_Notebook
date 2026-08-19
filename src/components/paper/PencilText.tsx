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

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.hand,
    fontSize: 32,
    lineHeight: 36,
    color: paperColors.pencil,
  },
  subtitle: {
    fontFamily: fonts.hand,
    fontSize: 22,
    lineHeight: 26,
    color: paperColors.pencil,
  },
  label: {
    fontFamily: fonts.hand,
    fontSize: 18,
    lineHeight: 22,
    color: paperColors.pencil,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: paperColors.pencil,
  },
  small: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: paperColors.pencilSoft,
  },
  code: {
    fontFamily: fonts.system,
    fontSize: 16,
    letterSpacing: 2,
    color: paperColors.pencil,
  },
});
