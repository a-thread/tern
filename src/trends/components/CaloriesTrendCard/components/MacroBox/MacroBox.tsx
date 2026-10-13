import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';

/** One macro's average, as a tinted tile. */
export function MacroBox({
  value,
  label,
  bg,
  color,
}: {
  value: string;
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[s.box, { backgroundColor: bg }]}>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flex: 1, borderRadius: 9, padding: 8, alignItems: 'center' },
  value: { fontFamily: font.bold, fontSize: 13.5 },
  label: { fontFamily: font.body, fontSize: 9, color: colors.ink2 },
});
