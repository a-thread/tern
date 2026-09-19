import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space } from '../../theme';

export function ProgressBar({
  value,
  color,
  track = colors.doveTint,
  height = 6,
}: {
  value: number;
  color: string;
  track?: string;
  height?: number;
}) {
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: track,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${Math.min(Math.max(value, 0), 1) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export function MacroBar({
  label,
  current,
  target,
  unit = 'g',
  color,
}: {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: string;
}) {
  return (
    <View style={{ paddingVertical: space.sm }}>
      <View style={s.macroTop}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={s.macroSub}>
          {current} / {target} {unit}
        </Text>
      </View>
      <ProgressBar value={current / target} color={color} height={5} />
    </View>
  );
}

const s = StyleSheet.create({
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroLabel: { fontFamily: font.body, fontSize: 13, color: colors.ink },
  macroSub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
});
