import { useEffect, useMemo, useRef } from 'react';

import { useDayKey } from '@shared/hooks/useDayKey';
import type { SearchResult } from '@food/data/sources/searchResult';
import { isUsdaEnabled } from '@food/data/sources/usda';
import { useCommonFoods } from '@food/CommonFoodsContext';
import { aliasesOf, searchCommonFoods } from '@food/models/commonFoods';
import { matchesQuery, rankFoods, stableMerge, type RankedFood } from '@food/models/foodRanking';
import { filterFoods } from '@food/models/recentFoods';
import { filterRecentMeals } from '@food/models/recentMeals';
import { filterMeals } from '@food/models/savedMeals';
import { useSavedMeals } from '@food/SavedMealsContext';
import { useLoggedFoods } from './useLoggedFoods';
import {
  FoodSearch,
  offEnglishSource,
  offSource,
  useFoodSearch,
  usdaSource,
  type SearchState,
} from './useFoodSearch';

export const FOOD_FILTERS = ['All', 'Meals', 'Recent'] as const;
export type FoodFilter = (typeof FOOD_FILTERS)[number];

/** When the network is asked, on top of what the phone already knows. */
export class LookupRules {
  /** Live USDA is a fallback: only when the phone has fewer matches than this. */
  static readonly USDA_BELOW = 3;
}

/** What a source has to show for `query`: its answer, or its last answer narrowed to the new words. */
function rowsFor(state: SearchState, query: string): SearchResult[] {
  if (state.status === 'idle') return [];
  if (state.query === query) return state.results;
  return state.results.filter((r) => matchesQuery(r, query));
}

/**
 * Everything the Add food screen can offer for a query, as one ranked list:
 * your own foods and the common-foods list straight away (no network), then
 * packaged products from Open Food Facts, and live USDA when the phone has
 * little to offer. Late results fold in without reordering what's on screen.
 */
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
  const { index } = useCommonFoods();
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
  const recent = useMemo(() => filterFoods(logged.recent, query), [logged.recent, query]);

  // On the phone, so on every keystroke.
  const mine = useMemo(
    () => (searching ? logged.mine.filter((r) => matchesQuery(r, trimmed)) : []),
    [logged.mine, trimmed, searching],
  );
  const common = useMemo(
    () => (searching ? searchCommonFoods(index, trimmed) : []),
    [index, trimmed, searching],
  );
  const local = mine.length + common.length;

  // Over the network, after a pause in typing.
  const all = filter === 'All';
  const usdaOn = isUsdaEnabled() && all && local < LookupRules.USDA_BELOW;
  const everyday = useFoodSearch(query, usdaOn, usdaSource);
  // When the phone already has matches, a foreign-language retry isn't worth a second request.
  const packaged = useFoodSearch(query, all, local ? offEnglishSource : offSource);
  const sources = [
    ...(usdaOn ? [{ label: 'USDA', ...everyday }] : []),
    { label: 'packaged foods', ...packaged },
  ];
  const pending = sources.some((x) => x.state.status === 'loading');
  const failed = sources.filter((x) => x.state.status === 'error');
  const retryFailed = () => failed.forEach((x) => x.retry());

  const ranked = useMemo(
    () =>
      searching
        ? rankFoods(trimmed, [
            { from: 'mine', foods: mine },
            { from: 'common', foods: common, aliases: aliasesOf(index) },
            { from: 'usda', foods: usdaOn ? rowsFor(everyday.state, trimmed) : [] },
            { from: 'off', foods: rowsFor(packaged.state, trimmed) },
          ])
        : [],
    [searching, trimmed, mine, common, index, usdaOn, everyday.state, packaged.state],
  );

  // What's on screen for this query, so a late source slots in without shuffling it.
  const shown = useRef<{ query: string; ids: string[] }>({ query: '', ids: [] });
  const foods: RankedFood[] = useMemo(
    () => (shown.current.query === trimmed ? stableMerge(shown.current.ids, ranked) : ranked),
    [ranked, trimmed],
  );
  useEffect(() => {
    shown.current = { query: trimmed, ids: foods.map((f) => f.id) };
  }, [foods, trimmed]);

  // "No matches" only once every source has answered this query, not while one is still waiting to ask.
  const settled = sources.every(
    (x) => x.state.status === 'error' || (x.state.status === 'done' && x.state.query === trimmed),
  );
  const nothingFound = searching && settled && !failed.length && !yourMeals.length && !foods.length;

  return {
    trimmed,
    searching,
    yourMeals,
    pastMeals,
    recent,
    foods,
    pending,
    failedLabels: failed.map((x) => x.label),
    failedAll: failed.length === sources.length,
    retryFailed,
    nothingFound,
  };
}

export type FoodLookup = ReturnType<typeof useFoodLookup>;
