import type { FoodEntry } from './foodEntry';
import type { SearchResult } from '@food/data/sources/searchResult';

const key = (name: string, brand?: string) =>
  `${name.trim().toLowerCase()}|${(brand ?? '').trim().toLowerCase()}`;

/**
 * A logged food as something to log again: its values, food type and the amount
 * you had. Logged by amount, it comes back per 100 g with its units and the unit
 * and count last used; otherwise it keeps its serving label and how many.
 */
export function loggedAsResult(
  e: Pick<
    FoodEntry,
    | 'name'
    | 'brand'
    | 'servings'
    | 'servingLabel'
    | 'calories'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'tier'
    | 'measure'
  >,
): SearchResult {
  const id = `logged-${key(e.name, e.brand)}`;
  const m = e.measure;
  if (m) {
    return {
      id,
      name: e.name,
      brand: e.brand,
      servingLabel: '100 g',
      ...m.per100,
      tier: e.tier,
      portions: m.portions.length ? m.portions : undefined,
      last: { unit: m.unit, quantity: m.quantity },
    };
  }
  return {
    id,
    name: e.name,
    brand: e.brand,
    servingLabel: e.servingLabel,
    calories: e.calories,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    tier: e.tier,
    ...(e.servings !== 1 ? { servings: e.servings } : {}),
  };
}

/**
 * Distinct foods from your log, newest first, ready to log again. A food's
 * values are those from the last time you logged it, including the food type
 * you chose, so a correction you made is remembered.
 *
 * `byDay` is entries grouped by day (YYYY-MM-DD); within a day, later entries
 * count as newer. `fromDay` leaves out anything before that day.
 */
export function recentFoods(
  byDay: Record<string, FoodEntry[]>,
  options: { fromDay?: string; limit?: number } = {},
): SearchResult[] {
  const { fromDay, limit = 40 } = options;
  const days = Object.keys(byDay)
    .filter((d) => !fromDay || d >= fromDay)
    .sort()
    .reverse();

  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const day of days) {
    for (const e of [...byDay[day]].reverse()) {
      const k = key(e.name, e.brand);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(loggedAsResult(e));
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Foods whose name or brand contains every word of `query`; all of them when the query is blank. */
export function filterFoods(
  foods: SearchResult[],
  query: string,
): SearchResult[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return foods;
  return foods.filter((f) => {
    const hay = `${f.name} ${f.brand ?? ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
