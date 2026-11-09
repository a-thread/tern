import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, tierColors } from '@shared/theme';
import { Row, Icon } from '@shared/components/ui';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { TierDot } from '@shared/components/TierDot';
import { FoodSource } from '@/domain/food/models/foodSource';

const SOURCE_TAG: Record<FoodSource, string> = {
  [FoodSource.Mine]: 'Your food',
  [FoodSource.Common]: 'Common',
  [FoodSource.Usda]: 'USDA',
  [FoodSource.Off]: 'Packaged',
};

/**
 * The line under a food's name: where it's from, and its detail or brand. No amount: the
 * serving is chosen on the details screen, so the list doesn't promise one it may not open on.
 */
export function resultSubline(
  r: SearchResult,
  from: FoodSource | undefined,
): string {
  return [from ? SOURCE_TAG[from] : undefined, r.brand ?? r.detail]
    .filter(Boolean)
    .join(' · ');
}

/** One food from a search or your history: its type dot, name, where it's from, and a plus to add it. */
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
  const { showTiers, showTierNumber } = useFoodDisplay();
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
      sub={resultSubline(result, from) || undefined}
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
