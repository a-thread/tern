import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font } from '../../shared/theme';

export function LinkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  link: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink2 },
});
