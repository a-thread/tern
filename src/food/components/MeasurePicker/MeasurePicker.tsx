import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, typography } from '@shared/theme';
import { Group, Stepper } from '@shared/components/ui';
import { Units } from '@shared/utils/units';
import { formatCount } from '@/domain/food/models/servings';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { isVolumeUnit, VolumeUnit } from '@/domain/food/models/volume';
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

const TYPED_LABEL: Record<VolumeUnit, string> = {
  [VolumeUnit.Ml]: 'Amount in millilitres',
  [VolumeUnit.FlOz]: 'Amount in fluid ounces',
};

/**
 * Chooses how much of a food: a unit (the database's household portions, such
 * as "large egg" or "cup", fl oz or ml for a drink, or grams) and how many.
 * Switching unit keeps the weight. Grams and volumes are typed; a quantity of
 * zero means the typed amount isn't usable yet.
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
  // A volume unit is too small for that to mean much, so it's just "fl oz" / "ml".
  const chipLabel = (p: Portion) => {
    if (isVolumeUnit(p.label)) return p.label;
    return showCalories
      ? `${sentence(p.label)} · ${Math.round((measure.per100.calories * p.grams) / 100)} cal`
      : sentence(p.label);
  };
  // The volume the user sets for water comes first: ml for metric, fl oz otherwise.
  const preferred = units === Units.Metric ? VolumeUnit.Ml : VolumeUnit.FlOz;
  const rank = (p: Portion) =>
    !isVolumeUnit(p.label) ? 0 : p.label === preferred ? 1 : 2;
  const chips = [...measure.portions].sort((a, b) => rank(a) - rank(b));

  const chooseUnit = (unit: string | null) => {
    const next = switchUnit(measure, unit);
    if (isTypedUnit(next.unit)) setTyped(formatCount(next.quantity));
    onChange(next);
  };

  const volume = isVolumeUnit(measure.unit) ? measure.unit : null;

  return (
    <Group>
      {measure.portions.length ? (
        <View style={s.chips}>
          {chips.map((p, i) => (
            <Chip
              key={`${p.label}-${i}`}
              label={chipLabel(p)}
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
      {portion && !volume ? (
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
            {volume && measure.quantity > 0 ? (
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
              volume ? TYPED_LABEL[volume] : 'Amount in grams'
            }
            style={[s.rowInput, { minWidth: 70 }]}
          />
          <Text style={s.rowTitle}>{volume ?? 'g'}</Text>
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
