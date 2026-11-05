import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, typography } from '../../theme';

/** A small circled "i" that opens an explanation. `label` says what it explains, for screen readers. */
export function InfoDot({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={s.info}
      accessibilityRole='button'
      accessibilityLabel={label}
    >
      <Text style={s.infoText}>i</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  info: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontFamily: font.semibold,
    fontSize: typography.small.fontSize,
    color: colors.ink3,
    lineHeight: 13,
  },
});
