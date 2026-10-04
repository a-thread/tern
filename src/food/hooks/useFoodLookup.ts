import { useMemo } from 'react';

import { useDayKey } from '@shared/hooks/useDayKey';
import type { SearchResult } from '@food/data/sources/searchResult';
import { isUsdaEnabled } from '@food/data/sources/usda';
import { filterFoods } from '@food/models/recentFoods';
import { filterRecentMeals } from '@food/models/recentMeals';
import { filterMeals } from '@food/models/savedMeals';
import { useSavedMeals } from '@food/SavedMealsContext';
import { useLoggedFoods } from './useLoggedFoods';
import { FoodSearch, offSource, useFoodSearch, usdaSource } from './useFoodSearch';

export const FOOD_FILTERS = ['All', 'Meals', 'My foods', 'Recent'] as const;
export type FoodFilter = (typeof FOOD_FILTERS)[number];

/** Everything the Add food screen can offer for a query: your own meals and foods, and both databases. */
export function useFoodLookup({
  query,
  filter,
  pickMode,
  meal,
}: {
  query: string;
  filter: FoodFilter;
  /** Choosing a food for a saved meal being built, not logging to today. */
  pickMode: boolean;
  /** The meal being added to; it is not offered back as a past meal. */
  meal: string;
}) {
  const today = useDayKey();
  const trimmed = query.trim();
  const searching = trimmed.length >= FoodSearch.MIN_CHARS;

  const logged = useLoggedFoods();
  const { meals: savedMeals } = useSavedMeals();
  const yourMeals = useMemo(
    () => (pickMode ? [] : filterMeals(savedMeals, query)),
    [savedMeals, query, pickMode],
  );
  // The meal you're adding to isn't offered back to you — it's the list you're already looking at.
  const pastMeals = useMemo(
    () =>
      pickMode
        ? []
        : filterRecentMeals(
            logged.meals.filter((m) => !(m.day === today && m.meal === meal)),
            query,
          ),
    [logged.meals, query, pickMode, today, meal],
  );
  const mine = useMemo(() => filterFoods(logged.mine, query), [logged.mine, query]);
  const recent = useMemo(() => filterFoods(logged.recent, query), [logged.recent, query]);

  // Two food databases, searched independently: USDA for everyday foods (with
  // household portions; needs an API key) and Open Food Facts for packaged ones.
  const usdaOn = isUsdaEnabled();
  const everyday = useFoodSearch(query, filter === 'All' && usdaOn, usdaSource);
  const packaged = useFoodSearch(query, filter === 'All', offSource);
  const sources = [
    ...(usdaOn ? [{ label: 'USDA', ...everyday }] : []),
    { label: 'Open Food Facts', ...packaged },
  ];
  const loading = sources.some((x) => x.state.status === 'loading');
  const failed = sources.filter((x) => x.state.status === 'error');
  const retryFailed = () => failed.forEach((x) => x.retry());

  // Your own foods that match come first, then the databases' results without repeats.
  const yourMatches = searching ? mine.slice(0, 5) : [];
  const foodKey = (r: SearchResult) => `${r.name}|${r.brand ?? ''}`.toLowerCase();
  const yourKeys = new Set(yourMatches.map(foodKey));
  const fresh = (st: typeof everyday.state) =>
    st.status === 'done' ? st.results.filter((r) => !yourKeys.has(foodKey(r))) : [];
  const everydayResults = fresh(everyday.state);
  const packagedResults = fresh(packaged.state);
  const nothingFound =
    !loading &&
    !failed.length &&
    !yourMeals.length &&
    !yourMatches.length &&
    !everydayResults.length &&
    !packagedResults.length;

  return {
    trimmed,
    searching,
    yourMeals,
    pastMeals,
    mine,
    recent,
    yourMatches,
    everydayResults,
    packagedResults,
    loading,
    failed,
    failedAll: failed.length === sources.length,
    failedLabels: failed.map((x) => x.label),
    retryFailed,
    nothingFound,
  };
}

export type FoodLookup = ReturnType<typeof useFoodLookup>;
