import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius } from '@shared/theme';
import { Group, Stepper } from '@shared/components/ui';
import { formatCount } from '@food/models/servings';
import {
  GramSteps,
  measureGrams,
  portionOf,
  sentence,
  stepMeasure,
  switchUnit,
  typedGrams,
  type Measure,
} from '@food/models/measure';

/**
 * Chooses how much of a food: a unit (the database's household portions, such
 * as "large egg" or "cup", or grams) and how many. Switching unit keeps the
 * weight. A quantity of zero means the typed weight isn't usable yet.
 */
export function MeasurePicker({
  measure,
  onChange,
}: {
  measure: Measure;
  onChange: (next: Measure) => void;
}) {
  const [typed, setTyped] = useState(String(formatCount(measure.quantity)));
  const portion = portionOf(measure);
  const grams = measureGrams(measure);

  const chooseUnit = (unit: string | null) => {
    const next = switchUnit(measure, unit);
    if (unit === null) setTyped(formatCount(next.quantity));
    onChange(next);
  };

  return (
    <Group>
      {measure.portions.length ? (
        <View style={s.chips}>
          {measure.portions.map((p, i) => (
            <Chip
              key={`${p.label}-${i}`}
              label={sentence(p.label)}
              on={measure.unit === p.label}
              onPress={() => chooseUnit(p.label)}
            />
          ))}
          <Chip
            label='Grams'
            on={measure.unit === null}
            onPress={() => chooseUnit(null)}
          />
        </View>
      ) : null}
      {portion ? (
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>How many</Text>
            <Text style={s.weightNote}>= {grams} g</Text>
          </View>
          <Stepper
            value={formatCount(measure.quantity)}
            onDecrement={() => onChange(stepMeasure(measure, -1))}
            onIncrement={() => onChange(stepMeasure(measure, 1))}
          />
        </View>
      ) : (
        <View style={s.row}>
          <Text style={[s.rowTitle, { flex: 1 }]}>Amount</Text>
          <TextInput
            value={typed}
            onChangeText={(v) => {
              const text = v.replace(/[^0-9.,]/g, '');
              setTyped(text);
              onChange(typedGrams(measure, text));
            }}
            keyboardType='decimal-pad'
            selectTextOnFocus
            maxLength={6}
            placeholder={String(GramSteps.STEP * 10)}
            placeholderTextColor={colors.ink3}
            accessibilityLabel='Amount in grams'
            style={[s.rowInput, { minWidth: 70 }]}
          />
          <Text style={s.rowTitle}>g</Text>
        </View>
      )}
    </Group>
  );
}

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, on && s.chipOn]}
      accessibilityRole='button'
      accessibilityState={{ selected: on }}
    >
      <Text style={[s.chipText, on && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.doveTint,
  },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink2 },
  chipTextOn: { color: colors.paper },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  weightNote: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 1,
  },
  rowInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    padding: 0,
    textAlign: 'right',
  },
});
