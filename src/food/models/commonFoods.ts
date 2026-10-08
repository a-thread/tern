import type { Portion, SearchResult } from '@food/data/sources/searchResult';
import type { Tier } from './foodEntry';
import { allWordsPrefix, wordsOf } from './foodQuery';
import { scoreResult } from './foodRanking';

/**
 * One food from the common-foods list: everyday foods with clean names,
 * per-100 g nutrition, household portions, how common they are and a
 * suggested food type. Built from USDA data and synced from the backend.
 */
export type CommonFood = {
  id: string;
  name: string;
  detail?: string;
  /** Other words people type for it: "oj", "pb". */
  aliases?: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portions?: Portion[];
  /** 1 is the most common. */
  rank: number;
  /** A suggested NOVA tier; the person can change it when logging. */
  tier: Tier | null;
};

export function commonFoodToResult(f: CommonFood): SearchResult {
  return {
    id: `common-${f.id}`,
    name: f.name,
    ...(f.detail ? { detail: f.detail } : {}),
    servingLabel: '100 g',
    calories: f.kcal,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    tier: f.tier,
    ...(f.portions?.length ? { portions: f.portions } : {}),
    source: 'common',
    rank: f.rank,
  };
}

type Entry = { food: CommonFood; result: SearchResult; words: string[] };

/** The list prepared for searching: words worked out once, not on every keystroke. */
export type CommonFoodIndex = { entries: Entry[]; aliases: Map<string, string[]> };

export function buildCommonIndex(foods: CommonFood[]): CommonFoodIndex {
  const aliases = new Map<string, string[]>();
  const entries = foods.map((food) => {
    const result = commonFoodToResult(food);
    if (food.aliases?.length) aliases.set(result.id, food.aliases);
    return {
      food,
      result,
      words: [
        ...wordsOf(food.name),
        ...wordsOf(food.detail ?? ''),
        ...(food.aliases ?? []).flatMap(wordsOf),
      ],
    };
  });
  return { entries, aliases };
}

export const emptyCommonIndex: CommonFoodIndex = { entries: [], aliases: new Map() };

/** The aliases of a common food result, for scoring. */
export const aliasesOf = (index: CommonFoodIndex) => (r: SearchResult) =>
  index.aliases.get(r.id) ?? [];

/** Common foods whose name, detail or aliases contain every word of the query as a prefix, best first. */
export function searchCommonFoods(
  index: CommonFoodIndex,
  query: string,
  limit = 25,
): SearchResult[] {
  const q = wordsOf(query);
  if (!q.length) return [];
  return index.entries
    .filter((e) => allWordsPrefix(q, e.words))
    .map((e) => ({ r: e.result, s: scoreResult(query, e.result, 'common', e.food.aliases) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.r);
}
