import React from 'react';
import { Icon } from '@/shared/components/ui';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@/shared/theme';
import type { RecentMeal } from '@/food/log-food/models/recentMeals';
import type { SavedMeal } from '@/domain/saved-meals/models/savedMeals';
import type { FoodLookup } from '@/food/log-food/search/hooks/useFoodLookup';
import { ListNote } from '@/food/log-food/components/ListNote/ListNote';
import { MealGroup } from '@/food/log-food/search/components/MealGroup/MealGroup';
import { RecentMealRow } from '@/food/log-food/search/components/RecentMealRow/RecentMealRow';
import { SavedMealRow } from '@/food/log-food/search/components/SavedMealRow/SavedMealRow';

/** The Meals tab: start a new meal, or pick one of your saved or past meals. */
export function LogFoodMealsTab({
  lookup,
  onNewMeal,
  onOpenMeal,
  onOpenPastMeal,
}: {
  lookup: FoodLookup;
  onNewMeal: () => void;
  onOpenMeal: (meal: SavedMeal) => void;
  onOpenPastMeal: (meal: RecentMeal) => void;
}) {
  const { yourMeals, pastMeals, trimmed } = lookup;
  return (
    <>
      <Pressable style={s.newMeal} onPress={onNewMeal}>
        <Icon name='plus' size={15} color={colors.coral} />
        <Text style={s.newMealText}>New meal</Text>
      </Pressable>
      {yourMeals.length ? <MealGroup label='Your meals' meals={yourMeals} onPick={onOpenMeal} Row={SavedMealRow} /> : null}
      {pastMeals.length ? <MealGroup label='Recent meals' meals={pastMeals} onPick={onOpenPastMeal} Row={RecentMealRow} /> : null}
      {!yourMeals.length && !pastMeals.length ? (
        <ListNote>
          {trimmed
            ? `Nothing matches “${trimmed}”.`
            : 'Build a meal with New meal, or log a few foods and choose “Save as meal” on the Food tab. Meals you log show up here too.'}
        </ListNote>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  newMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: space.md,
  },
  newMealText: { fontFamily: font.semibold, fontSize: 14, color: colors.coral },
});
