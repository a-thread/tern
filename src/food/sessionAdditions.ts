import { MEAL_OPTIONS, type FoodEntry } from './models';

/** Log entries that weren't there when `baseline` (a set of entry ids) was taken. */
export const additionsSince = (
  baseline: ReadonlySet<string>,
  log: FoodEntry[],
): FoodEntry[] => log.filter((f) => !baseline.has(f.id));

/**
 * A short confirmation of what was added, e.g. "Added to Lunch: Oats, Banana
 * (+1 more)". Null when nothing was added.
 */
export function describeAdditions(added: FoodEntry[], maxNames = 2): string | null {
  if (!added.length) return null;
  const names = added.slice(0, maxNames).map((f) => f.name);
  const more = added.length - names.length;
  const list = more > 0 ? `${names.join(', ')} (+${more} more)` : names.join(', ');

  const meals = new Set(added.map((f) => f.meal));
  if (meals.size === 1) {
    const meal = added[0].meal;
    const label = MEAL_OPTIONS.find((m) => m.key === meal)?.label ?? meal;
    return `Added to ${label}: ${list}`;
  }
  return `Added ${added.length} ${added.length === 1 ? 'food' : 'foods'}: ${list}`;
}
