import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, typography } from '@shared/theme';
import { Group, Stepper } from '@shared/components/ui';
import { Units } from '@shared/utils/units';
import { formatCount } from '@/domain/food/models/servings';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { VolumeUnit } from '@/domain/food/models/volume';
import { WeightUnit } from '@/domain/food/models/weight';
import type { Portion } from '@/domain/food/sources/searchResult';
import {
  GramSteps,
  isTypedUnit,
  measureGrams,
  portionOf,
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

// The order the switch offers weights in: the user's own system first.
const WEIGHT_ORDER: Record<Units, TypedChoice[]> = {
  [Units.Imperial]: [WeightUnit.Oz, WeightUnit.Lb, null],
  [Units.Metric]: [null, WeightUnit.Oz, WeightUnit.Lb],
};
const VOLUME_ORDER: Record<Units, TypedChoice[]> = {
  [Units.Imperial]: [VolumeUnit.FlOz, VolumeUnit.Ml],
  [Units.Metric]: [VolumeUnit.Ml, VolumeUnit.FlOz],
};

/**
 * Chooses how much of a food. The chips are the food's household portions
 * ("large egg", "cup"), counted with a stepper. Next to the typed amount a
 * small switch picks g, oz or lb (and ml or fl oz for a drink). Switching
 * unit keeps the weight; a quantity of zero means the typed amount isn't
 * usable yet.
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
  const { showCalories } = useFoodDisplay();
  const { units } = useUnits();
  // Each size says what one of it is worth: "Large egg · 72", "Jumbo egg · 90".
  const chipLabel = (p: Portion) =>
    showCalories
      ? `${sentence(p.label)} · ${Math.round((measure.per100.calories * p.grams) / 100)} cal`
      : sentence(p.label);
  // Typed units (oz, lb, fl oz, ml) live in the switch, not the chips.
  const chips = measure.portions.filter((p) => !isTypedUnit(p.label));

  // g is always on offer; the rest only when the food has the portion.
  const has = (unit: TypedChoice) =>
    unit === null || measure.portions.some((p) => p.label === unit);
  const choices = [...WEIGHT_ORDER[units], ...VOLUME_ORDER[units]].filter(has);

  const chooseUnit = (unit: string | null) => {
    const next = switchUnit(measure, unit);
    if (isTypedUnit(next.unit)) setTyped(formatCount(next.quantity));
    onChange(next);
  };

  const counted = !!portion && !isTypedUnit(measure.unit);
  const typedUnit = isTypedUnit(measure.unit) ? measure.unit : null;

  return (
    <Group>
      {chips.length ? (
        <View style={s.chips}>
          {chips.map((p, i) => (
            <Chip
              key={`${p.label}-${i}`}
              label={chipLabel(p)}
              on={measure.unit === p.label}
              onPress={() => chooseUnit(p.label)}
            />
          ))}
        </View>
      ) : null}
      {counted ? (
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
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Amount</Text>
            {typedUnit !== null && measure.quantity > 0 ? (
              <Text style={s.weightNote}>= {grams} g</Text>
            ) : null}
          </View>
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
            style={[s.rowInput, { minWidth: 70 }]}
          />
        </View>
      )}
      <View style={s.unitRow}>
        <Text style={s.unitTitle}>{counted ? 'Or by' : 'Unit'}</Text>
        <View style={s.switch} accessibilityRole='radiogroup'>
          {choices.map((unit) => {
            const on = !counted && typedUnit === unit;
            return (
              <Pressable
                key={unit ?? 'g'}
                onPress={() => chooseUnit(unit)}
                hitSlop={6}
                style={[s.segment, on && s.segmentOn]}
                accessibilityRole='radio'
                accessibilityLabel={UNIT_NAME[unit ?? 'g']}
                accessibilityState={{ selected: on, checked: on }}
              >
                <Text style={[s.segmentText, on && s.segmentTextOn]}>
                  {unit ?? 'g'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingBottom: 12,
    gap: 8,
  },
  unitTitle: typography.caption,
  switch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.doveTint,
  },
  segment: {
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  segmentOn: { backgroundColor: colors.ink },
  segmentText: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink2 },
  segmentTextOn: { color: colors.paper },
  rowTitle: typography.rowTitle,
  weightNote: { ...typography.caption, marginTop: 1 },
  rowInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    padding: 0,
    textAlign: 'right',
  },
});
