import type { FoodEntry } from '@/domain/food/models/foodEntry';
import type { SearchResult } from '@/domain/food/sources/searchResult';

const key = (name: string, brand?: string) =>
  `${name.trim().toLowerCase()}|${(brand ?? '').trim().toLowerCase()}`;

/** Measured foods come back per 100 g with the last unit; others keep their serving label. */
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

/** Newest first, with the last-logged values so corrections stick. */
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
