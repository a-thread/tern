import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, typography } from '@shared/theme';
import { Group, Stepper } from '@shared/components/ui';
import { Units } from '@shared/utils/units';
import { formatCount } from '@/domain/food/models/servings';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { VolumeUnit } from '@/domain/food/models/volume';
import { weightNote, WeightUnit } from '@/domain/food/models/weight';
import {
  amountText,
  GramSteps,
  isTypedUnit,
  measureGrams,
  sentence,
  stepMeasure,
  switchUnit,
  typedAmount,
  type Measure,
} from '@/domain/food/models/measure';

// null is grams.
type TypedChoice = null | WeightUnit | VolumeUnit;

const TYPED_LABEL: Record<string, string> = {
  [VolumeUnit.Ml]: 'Amount in millilitres',
  [VolumeUnit.FlOz]: 'Amount in fluid ounces',
  [WeightUnit.Oz]: 'Amount in ounces',
  [WeightUnit.Lb]: 'Amount in pounds',
};

const GRAMS_LABEL = 'Amount in grams';

const UNIT_NAME: Record<string, string> = {
  g: 'Grams',
  [WeightUnit.Oz]: 'Ounces',
  [WeightUnit.Lb]: 'Pounds',
  [VolumeUnit.Ml]: 'Millilitres',
  [VolumeUnit.FlOz]: 'Fluid ounces',
};

// The order weights and volumes are offered in: the user's own system first.
const WEIGHT_ORDER: Record<Units, TypedChoice[]> = {
  [Units.Imperial]: [WeightUnit.Oz, WeightUnit.Lb, null],
  [Units.Metric]: [null, WeightUnit.Oz, WeightUnit.Lb],
};
const VOLUME_ORDER: Record<Units, TypedChoice[]> = {
  [Units.Imperial]: [VolumeUnit.FlOz, VolumeUnit.Ml],
  [Units.Metric]: [VolumeUnit.Ml, VolumeUnit.FlOz],
};

/**
 * Chooses how much of a food: first the unit, from one unlabelled list (the food's own sizes,
 * then weights, and volumes for a drink), then how much of it. Counted sizes ("packet") use a
 * stepper; weights and volumes are typed. The amount is named with its unit and what it
 * weighs. Switching unit keeps the weight; a quantity of zero means a typed amount isn't
 * usable yet.
 */
export function MeasurePicker({
  measure,
  onChange,
}: {
  measure: Measure;
  onChange: (next: Measure) => void;
}) {
  const { units } = useUnits();
  const [typed, setTyped] = useState(String(formatCount(measure.quantity)));

  const counted = !isTypedUnit(measure.unit);
  const typedUnit = counted ? null : measure.unit;

  // Every unit in one list: the food's sizes, then weights, then volumes it offers.
  const has = (unit: TypedChoice) =>
    unit === null || measure.portions.some((p) => p.label === unit);
  const unitList: (string | null)[] = [
    ...measure.portions.filter((p) => !isTypedUnit(p.label)).map((p) => p.label),
    ...[...WEIGHT_ORDER[units], ...VOLUME_ORDER[units]].filter(has),
  ];

  const chooseUnit = (unit: string | null) => {
    const next = switchUnit(measure, unit);
    if (isTypedUnit(next.unit)) setTyped(formatCount(next.quantity));
    onChange(next);
  };

  // "1.5 packets · 1.9 oz": the amount, and what it weighs in the person's units unless it's typed in them.
  const weight = weightNote(
    measureGrams(measure),
    units,
    counted ? undefined : typedUnit,
  )?.slice(2);
  const note = measure.quantity > 0 ? [amountText(measure), weight] : [];

  return (
    <Group>
      <View style={s.units}>
        <View
          style={s.list}
          accessibilityRole='radiogroup'
          accessibilityLabel='Unit'
        >
          {unitList.map((unit) => {
            const on = measure.unit === unit;
            const typedName = isTypedUnit(unit) ? UNIT_NAME[unit ?? 'g'] : null;
            return (
              <Pressable
                key={unit ?? 'g'}
                onPress={() => chooseUnit(unit)}
                hitSlop={4}
                style={[s.option, on && s.optionOn]}
                accessibilityRole='radio'
                accessibilityLabel={typedName ?? sentence(unit ?? '')}
                accessibilityState={{ selected: on, checked: on }}
              >
                <Text style={[s.optionText, on && s.optionTextOn]}>
                  {typedName ? (unit ?? 'g') : sentence(unit ?? '')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>How much</Text>
          {note.length ? (
            <Text style={s.caption}>{note.filter(Boolean).join(' · ')}</Text>
          ) : null}
        </View>
        {counted ? (
          <Stepper
            value={formatCount(measure.quantity)}
            onDecrement={() => onChange(stepMeasure(measure, -1))}
            onIncrement={() => onChange(stepMeasure(measure, 1))}
            decrementLabel='Less'
            incrementLabel='More'
          />
        ) : (
          <View style={s.typed}>
            <TextInput
              value={typed}
              onChangeText={(v) => {
                const text = v.replace(/[^0-9.,]/g, '');
                setTyped(text);
                onChange(typedAmount(measure, text));
              }}
              keyboardType='decimal-pad'
              selectTextOnFocus
              maxLength={6}
              placeholder={String(GramSteps.STEP * 10)}
              placeholderTextColor={colors.ink3}
              accessibilityLabel={
                typedUnit === null ? GRAMS_LABEL : TYPED_LABEL[typedUnit]
              }
              style={s.input}
            />
            <Text style={s.rowTitle}>{typedUnit ?? 'g'}</Text>
          </View>
        )}
      </View>
    </Group>
  );
}

const s = StyleSheet.create({
  units: { paddingHorizontal: 13, paddingVertical: 12 },
  caption: typography.caption,
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: {
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.doveTint,
  },
  optionOn: { backgroundColor: colors.ink },
  optionText: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink2 },
  optionTextOn: { color: colors.paper },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
  },
  rowTitle: typography.rowTitle,
  typed: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    minWidth: 60,
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    padding: 0,
    textAlign: 'right',
  },
});
