import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { Row } from '@shared/components/ui';
import { savedMealTotals, type SavedMeal } from '@food/models/savedMeals';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';

/** A saved meal: its name, how many foods it holds and, if shown, its calories. */
export function SavedMealRow({ meal, onPress }: { meal: SavedMeal; onPress: () => void }) {
  const { showCalories } = useFoodDisplay();
  const cals = Math.round(savedMealTotals(meal.items).calories);
  const n = meal.items.length;
  return (
    <Row
      icon={
        <View style={s.icon}>
          <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
            <Path d='M6 3h12v18l-6-4-6 4V3z' stroke={colors.ink2} strokeWidth={2.2} strokeLinejoin='round' />
          </Svg>
        </View>
      }
      title={meal.name}
      sub={`${n} ${n === 1 ? 'food' : 'foods'}${showCalories ? ` · ${cals} cal` : ''}`}
      chevron
      onPress={onPress}
    />
  );
}

const s = StyleSheet.create({
  icon: {
    width: 19,
    height: 19,
    borderRadius: 6,
    backgroundColor: colors.doveTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
