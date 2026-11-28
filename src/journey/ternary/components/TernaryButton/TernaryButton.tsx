import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/** A button's colour: coral for a page's main step, aurora (the ternary's own) for sharing. */
export enum ButtonTone {
  Coral = 'coral',
  Aurora = 'aurora',
}

const TONE_COLORS: Record<ButtonTone, string> = {
  [ButtonTone.Coral]: colors.coral,
  [ButtonTone.Aurora]: colors.aurora,
};

/** The ternary's main action on a page; outlined when it's the second choice. */
export function TernaryButton({
  label,
  onPress,
  disabled,
  outline,
  tone = ButtonTone.Coral,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  outline?: boolean;
  tone?: ButtonTone;
}) {
  const color = TONE_COLORS[tone];
  return (
    <Pressable
      style={[
        s.button,
        outline
          ? [s.outline, { borderColor: color }]
          : { backgroundColor: color },
        disabled && s.off,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      <Text style={[s.label, outline && { color }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
  },
  off: { opacity: 0.5 },
  label: { fontFamily: font.bold, fontSize: 15, color: colors.onAction },
});
