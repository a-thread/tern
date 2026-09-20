import type { FoodEntry } from './models';
import type { SearchResult } from './searchData';

const key = (name: string, brand?: string) =>
  `${name.trim().toLowerCase()}|${(brand ?? '').trim().toLowerCase()}`;

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
      out.push({
        id: `logged-${k}`,
        name: e.name,
        brand: e.brand,
        servingLabel: e.servingLabel,
        calories: e.calories,
        protein: e.protein,
        carbs: e.carbs,
        fat: e.fat,
        tier: e.tier,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Foods whose name or brand contains every word of `query`; all of them when the query is blank. */
export function filterFoods(foods: SearchResult[], query: string): SearchResult[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return foods;
  return foods.filter((f) => {
    const hay = `${f.name} ${f.brand ?? ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
