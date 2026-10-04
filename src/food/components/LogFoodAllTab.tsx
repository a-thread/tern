import React from 'react';

import type { SearchResult } from '@food/data/sources/searchResult';
import type { RecentMeal } from '@food/models/recentMeals';
import type { SavedMeal } from '@food/models/savedMeals';
import type { FoodLookup } from '@food/hooks/useFoodLookup';
import { FoodGroup } from './FoodGroup';
import { ListNote } from './ListNote';
import { RecentMealGroup } from './RecentMealGroup';
import { SavedMealGroup } from './SavedMealGroup';
import { SearchStatus } from './SearchStatus';

/** The All tab: your meals and recent foods before a search, matches from everywhere once there is one. */
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

  if (!l.searching) {
    return (
      <>
        {l.yourMeals.length ? <SavedMealGroup label='Your meals' meals={l.yourMeals} onPick={onOpenMeal} /> : null}
        {l.pastMeals.length ? (
          <RecentMealGroup label='Recent meals' meals={l.pastMeals.slice(0, 5)} onPick={onOpenPastMeal} />
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
        <SavedMealGroup label='Your meals' meals={l.yourMeals.slice(0, 5)} onPick={onOpenMeal} />
      ) : null}
      {l.yourMatches.length ? <FoodGroup label='Your foods' foods={l.yourMatches} onPick={onPickFood} /> : null}
      {l.everydayResults.length ? (
        <FoodGroup label='Everyday foods' foods={l.everydayResults} onPick={onPickFood} />
      ) : null}
      {l.packagedResults.length ? <FoodGroup label='Packaged' foods={l.packagedResults} onPick={onPickFood} /> : null}
      <SearchStatus
        loading={l.loading}
        failedLabels={l.failedLabels}
        failedAll={l.failedAll}
        onRetry={l.retryFailed}
      />
      {l.nothingFound ? (
        <ListNote>No matches for “{l.trimmed}”. Try fewer words, or create it below.</ListNote>
      ) : null}
    </>
  );
}
