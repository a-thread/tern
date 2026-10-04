import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, font, tierColors } from '@shared/theme';
import { Row } from '@shared/components/ui';
import type { SearchResult } from '@food/data/sources/searchResult';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { TierDot } from './TierDot';

/** One food from a search or your history: its type dot, name, serving, and a plus to add it. */
export function FoodResultRow({ result, onPress }: { result: SearchResult; onPress: () => void }) {
  const unknown = result.tier === null; // food type not known; nutrition always is
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();
  const brandPrefix = result.brand ? result.brand + ' · ' : '';
  const detail = showCalories
    ? `${brandPrefix}${result.calories} cal / ${result.servingLabel}`
    : `${brandPrefix}${result.servingLabel}`;
  return (
    <Row
      icon={
        !showTiers ? undefined : unknown ? (
          <View style={s.tierUnknown}>
            <Text style={s.tierUnknownText}>?</Text>
          </View>
        ) : (
          <TierDot
            tier={result.tier as number}
            color={tierColors[result.tier as 1 | 2 | 3 | 4]}
            showNumber={showTierNumber}
          />
        )
      }
      title={result.name}
      sub={detail}
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
  tierUnknown: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.dove,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierUnknownText: { fontFamily: font.bold, fontSize: 9.5, color: '#4A4A4A' },
});
