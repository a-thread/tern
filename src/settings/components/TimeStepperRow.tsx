import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';

/** A labelled row with a − / + stepper around a value, for times and days. */
export default function TimeStepperRow({
  label,
  value,
  onStep,
}: {
  label: string;
  value: string;
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <View style={s.stepper}>
        <Pressable
          onPress={() => onStep(-1)}
          hitSlop={8}
          accessibilityLabel={`Earlier ${label}`}
        >
          <Text style={s.btn}>−</Text>
        </Pressable>
        <Text style={s.value}>{value}</Text>
        <Pressable
          onPress={() => onStep(1)}
          hitSlop={8}
          accessibilityLabel={`Later ${label}`}
        >
          <Text style={s.btn}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingLeft: 26,
    paddingVertical: 8,
  },
  label: { flex: 1, fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  btn: {
    fontFamily: font.body,
    fontSize: 17,
    color: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  value: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    color: colors.ink,
    minWidth: 78,
    textAlign: 'center',
  },
});
