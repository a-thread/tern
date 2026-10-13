import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@shared/theme';

/** One entry in a chart legend: a small swatch and what it means. `border` outlines a pale swatch. */
export function LegendDot({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: string;
}) {
  return (
    <View style={s.item}>
      <View
        style={[
          s.swatch,
          { backgroundColor: color },
          border ? { borderWidth: 1, borderColor: border } : null,
        ]}
      />
      <Text style={s.text}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 9, height: 9, borderRadius: 2 },
  text: { fontFamily: font.body, fontSize: 10, color: colors.ink2 },
});
