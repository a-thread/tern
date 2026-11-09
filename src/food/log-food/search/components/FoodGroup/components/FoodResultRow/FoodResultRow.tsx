import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, tierColors } from '@shared/theme';
import { Row, Icon } from '@shared/components/ui';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { TierDot } from '@shared/components/TierDot';
import { FoodSource } from '@/domain/food/models/foodSource';
import { Units } from '@shared/utils/units';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { WeightUnit, weightGrams } from '@/domain/food/models/weight';

const OUNCE_GRAMS = weightGrams(WeightUnit.Oz);

const SOURCE_TAG: Record<FoodSource, string> = {
  [FoodSource.Mine]: 'Your food',
  [FoodSource.Common]: 'Common',
  [FoodSource.Usda]: 'USDA',
  [FoodSource.Off]: 'Packaged',
};

/**
 * The line under a food's name: where it's from, its detail or brand, and the
 * calories for its first portion ("1 packet · 130 cal") when it has one. Without one,
 * per ounce on Imperial ("105 cal / oz") or per its serving on Metric ("371 cal / 100 g").
 */
export function resultSubline(
  r: SearchResult,
  from: FoodSource | undefined,
  showCalories: boolean,
  units: Units,
): string {
  const per100 = r.servingLabel === '100 g';
  const portion = per100 ? r.portions?.[0] : undefined;
  const byOunce = per100 && !portion && units === Units.Imperial;
  const calFor = (grams: number) => Math.round((r.calories * grams) / 100);
  const amount = portion
    ? showCalories
      ? `1 ${portion.label} · ${calFor(portion.grams)} cal`
      : `1 ${portion.label}`
    : byOunce
      ? showCalories
        ? `${calFor(OUNCE_GRAMS)} cal / oz`
        : 'per oz'
      : showCalories
        ? `${r.calories} cal / ${r.servingLabel}`
        : r.servingLabel;
  return [from ? SOURCE_TAG[from] : undefined, r.brand ?? r.detail, amount]
    .filter(Boolean)
    .join(' · ');
}

/** One food from a search or your history: its type dot, name, serving, and a plus to add it. */
export function FoodResultRow({
  result,
  from,
  onPress,
}: {
  result: SearchResult;
  /** Shown as a small tag in the search list; left out where the source is obvious. */
  from?: FoodSource;
  onPress: () => void;
}) {
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();
  const { units } = useUnits();
  return (
    <Row
      icon={
        !showTiers ? undefined : result.tier === null ? (
          // No suggestion yet: an empty slot keeps names lined up; the type is chosen when logging.
          <View style={s.tierSlot} />
        ) : (
          <TierDot
            tier={result.tier}
            color={tierColors[result.tier]}
            showNumber={showTierNumber}
          />
        )
      }
      title={result.name}
      sub={resultSubline(result, from, showCalories, units)}
      onPress={onPress}
      right={
        <View style={s.plusBtn}>
          <Icon name='plus' size={14} color={colors.coral} />
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  plusBtn: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: colors.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierSlot: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
