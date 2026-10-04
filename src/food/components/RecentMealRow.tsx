import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, font } from '@shared/theme';
import { Chevron } from '@shared/components/ui';
import { savedMealTotals } from '@food/models/savedMeals';
import type { RecentMeal } from '@food/models/recentMeals';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';

/** A meal from a past day: the day and meal it was, and what was in it. */
export function RecentMealRow({ meal, onPress }: { meal: RecentMeal; onPress: () => void }) {
  const { showCalories } = useFoodDisplay();
  const cals = Math.round(savedMealTotals(meal.items).calories);
  const n = meal.items.length;
  const names = meal.items.map((i) => i.name).join(', ');
  return (
    <Pressable style={s.row} android_ripple={{ color: colors.doveTint }} onPress={onPress}>
      <View style={s.icon}>
        <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
          <Path
            d='M12 3a9 9 0 1 0 9 9M12 7v5l3 2'
            stroke={colors.ink2}
            strokeWidth={2.2}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{meal.title}</Text>
        <Text style={s.sub} numberOfLines={1}>
          {showCalories ? `${cals} cal · ` : `${n} ${n === 1 ? 'food' : 'foods'} · `}
          {names}
        </Text>
      </View>
      <Chevron />
    </Pressable>
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
  icon: {
    width: 19,
    height: 19,
    borderRadius: 6,
    backgroundColor: colors.doveTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2, marginTop: 1 },
});
