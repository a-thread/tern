import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { Stepper } from '@shared/components/ui';
import {
  clampSteps,
  MovementLimits,
} from '@/domain/movement/models/movementEntry';

/** Steps taken without the phone, typed or stepped by the hundred. */
export function StepsRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (steps: number) => void;
}) {
  const [typed, setTyped] = useState<string | null>(null);
  const step = (dir: 1 | -1) => {
    setTyped(null);
    const by = MovementLimits.STEPS_STEP;
    onChange(
      clampSteps(
        dir > 0
          ? Math.floor(value / by) * by + by
          : Math.ceil(value / by) * by - by,
      ),
    );
  };
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Steps</Text>
        <Text style={s.sub}>The ones your phone missed</Text>
      </View>
      <Stepper
        value={typed ?? String(value)}
        valueMinWidth={64}
        decrementLabel='Fewer steps'
        incrementLabel='More steps'
        onDecrement={() => step(-1)}
        onIncrement={() => step(1)}
        onChangeValue={(v) => {
          const text = v.replace(/[^0-9]/g, '');
          setTyped(text);
          const n = Number(text);
          if (text && n >= MovementLimits.MIN_STEPS) onChange(clampSteps(n));
        }}
        onEndEditing={() => setTyped(null)}
        keyboardType='number-pad'
        valueLabel='Steps taken'
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: typography.rowTitle,
  sub: { ...typography.caption, marginTop: 2 },
});
