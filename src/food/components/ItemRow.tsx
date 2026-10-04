import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, tierColors } from '@shared/theme';
import type { FoodEntry } from '@food/models/foodEntry';
import { TierDot } from './TierDot';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';

type Item = Pick<
  FoodEntry,
  'name' | 'servings' | 'servingLabel' | 'calories' | 'tier'
>;

/**
 * One food in a list: food-type dot, name, portion and calories, following the
 * display settings. With `onPress` the whole row is tappable.
 */
export default function ItemRow({
  item,
  onPress,
}: {
  item: Item;
  onPress?: () => void;
}) {
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();
  const row = (
    <View style={s.row}>
      {showTiers ? (
        <TierDot
          tier={item.tier}
          color={tierColors[item.tier]}
          showNumber={showTierNumber}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{item.name}</Text>
        <Text style={s.sub}>
          {item.servings === 1
            ? item.servingLabel
            : `${item.servings} × ${item.servingLabel}`}
        </Text>
      </View>
      {showCalories ? (
        <Text style={s.cals}>{Math.round(item.calories * item.servings)}</Text>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.doveTint }}
      accessibilityRole='button'
      accessibilityLabel={`Add ${item.name}`}
    >
      {row}
    </Pressable>
  ) : (
    row
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  name: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  sub: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.ink2,
    marginTop: 1,
  },
  cals: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
});
