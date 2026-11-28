import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/** Outlined, the same size as the primary button: saying no is as easy to find as saying yes. */
export function SecondaryButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[s.button, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityState={{ disabled }}
    >
      <Text style={s.text}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.lg - 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: space.sm,
  },
  text: { fontFamily: font.bold, fontSize: 14.5, color: colors.ink },
});
