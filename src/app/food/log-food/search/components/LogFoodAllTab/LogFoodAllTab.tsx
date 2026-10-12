import React, { useLayoutEffect, useRef } from 'react';
import { LayoutAnimation } from 'react-native';

import type { SearchResult } from '@/domain/food/sources/searchResult';
import type { RecentMeal } from '@/food/log-food/models/recentMeals';
import type { SavedMeal } from '@/domain/saved-meals/models/savedMeals';
import type { FoodLookup } from '@/food/log-food/search/hooks/useFoodLookup';
import { FoodGroup } from '@/food/log-food/search/components/FoodGroup/FoodGroup';
import { ListNote } from '@/food/log-food/components/ListNote/ListNote';
import { MealGroup } from '@/food/log-food/search/components/MealGroup/MealGroup';
import { RecentMealRow } from '@/food/log-food/search/components/RecentMealRow/RecentMealRow';
import { SavedMealRow } from '@/food/log-food/search/components/SavedMealRow/SavedMealRow';
import { SearchStatus } from '@/food/log-food/search/components/LogFoodAllTab/components/SearchStatus/SearchStatus';

/** The All tab: your meals and recent foods before a search, one ranked list of foods once there is one. */
export function LogFoodAllTab({
  lookup,
  onPickFood,
  onOpenMeal,
  onOpenPastMeal,
}: {
  lookup: FoodLookup;
  onPickFood: (result: SearchResult) => void;
  onOpenMeal: (meal: SavedMeal) => void;
  onOpenPastMeal: (meal: RecentMeal) => void;
}) {
  const l = lookup;

  // When results arrive for the query already on screen, rows ease into place rather than snap.
  // A layout effect runs before the native views update, so the animation applies to this change.
  const ids = l.foods.map((f) => f.id).join('|');
  const lastQuery = useRef(l.trimmed);
  useLayoutEffect(() => {
    if (lastQuery.current === l.trimmed) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    lastQuery.current = l.trimmed;
  }, [ids, l.trimmed]);

  if (!l.searching) {
    return (
      <>
        {l.yourMeals.length ? <MealGroup label='Your meals' meals={l.yourMeals} onPick={onOpenMeal} Row={SavedMealRow} /> : null}
        {l.pastMeals.length ? (
          <MealGroup label='Recent meals' meals={l.pastMeals.slice(0, 5)} onPick={onOpenPastMeal} Row={RecentMealRow} />
        ) : null}
        {l.recent.length ? <FoodGroup label='Logged recently' foods={l.recent} onPick={onPickFood} /> : null}
        {!l.yourMeals.length && !l.pastMeals.length && !l.recent.length ? (
          <ListNote>
            Search foods above, or scan a barcode. Foods you log will show up here for next time.
          </ListNote>
        ) : null}
      </>
    );
  }

  return (
    <>
      {l.yourMeals.length ? (
        <MealGroup label='Your meals' meals={l.yourMeals.slice(0, 5)} onPick={onOpenMeal} Row={SavedMealRow} />
      ) : null}
      {l.foods.length ? <FoodGroup label='Foods' foods={l.foods} onPick={onPickFood} /> : null}
      <SearchStatus
        failedLabels={l.failedLabels}
        failedAll={l.failedAll}
        anyResults={l.foods.length > 0}
        onRetry={l.retryFailed}
      />
      {l.nothingFound ? (
        <ListNote>No matches for “{l.trimmed}”. Try fewer words, or create it below.</ListNote>
      ) : null}
    </>
  );
}
