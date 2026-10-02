import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { Stepper } from '@shared/components/ui';

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
      <Stepper
        value={value}
        onDecrement={() => onStep(-1)}
        onIncrement={() => onStep(1)}
        decrementLabel={`Earlier ${label}`}
        incrementLabel={`Later ${label}`}
        valueMinWidth={78}
      />
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
});
