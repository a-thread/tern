import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/** The ternary's main action on a page, in coral; outlined when it's the second choice. */
export function TernaryButton({
  label,
  onPress,
  disabled,
  outline,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  outline?: boolean;
}) {
  return (
    <Pressable
      style={[s.button, outline && s.outline, disabled && s.off]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      <Text style={[s.label, outline && s.outlineLabel]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  off: { opacity: 0.5 },
  label: { fontFamily: font.bold, fontSize: 15, color: colors.onAction },
  outlineLabel: { color: colors.coral },
});
