import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, tierColors } from '@shared/theme';
import { Row } from '@shared/components/ui';
import type { SearchResult } from '@food/data/sources/searchResult';
import type { FoodSource } from '@food/models/foodRanking';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { TierDot } from './TierDot';

const SOURCE_TAG: Record<FoodSource, string> = {
  mine: 'Your food',
  common: 'Common',
  usda: 'USDA',
  off: 'Packaged',
};

/**
 * The line under a food's name: where it's from, its detail or brand, and the
 * calories for its first portion ("1 large egg · 72 cal") when it has one,
 * otherwise per its serving ("143 cal / 100 g").
 */
export function resultSubline(
  r: SearchResult,
  from: FoodSource | undefined,
  showCalories: boolean,
): string {
  const portion = r.servingLabel === '100 g' ? r.portions?.[0] : undefined;
  const amount = portion
    ? showCalories
      ? `1 ${portion.label} · ${Math.round((r.calories * portion.grams) / 100)} cal`
      : `1 ${portion.label}`
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
      sub={resultSubline(result, from, showCalories)}
      onPress={onPress}
      right={
        <View style={s.plusBtn}>
          <Svg width={12} height={12} viewBox='0 0 24 24' fill='none' stroke={colors.coral} strokeWidth={3}>
            <Path d='M12 5v14M5 12h14' />
          </Svg>
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
  tierSlot: { width: 19, height: 19, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
});
