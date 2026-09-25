import { addDays, formatShortDate, weekdayName } from '@shared/utils/date';
import { MEAL_OPTIONS, type FoodEntry } from './models';
import { snapshotItems, type SavedMealItem } from './savedMeals';

/** A meal you've already logged on some day, ready to log again. */
export type RecentMeal = {
  /** `${day}-${meal}` — stable, so a screen can find it again by id. */
  id: string;
  day: string;
  meal: FoodEntry['meal'];
  /** "Yesterday’s dinner" */
  title: string;
  items: SavedMealItem[];
};

/**
 * Within a day, the latest meal first, so the meal you're most likely to
 * repeat is nearest the top. Snacks sit after the meals of that day.
 */
const WITHIN_DAY: FoodEntry['meal'][] = ['dinner', 'lunch', 'breakfast', 'snack'];

const mealLabel = (meal: FoodEntry['meal']) =>
  MEAL_OPTIONS.find((m) => m.key === meal)?.label ?? meal;

/** "Today" / "Yesterday" / a weekday for the past week; null for anything older. */
function namedDay(day: string, today: string): string | null {
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  if (day > addDays(today, -7)) return weekdayName(day);
  return null;
}

/** "Today", "Yesterday", "Monday", or "Sep 12". */
export const dayLabel = (day: string, today: string) =>
  namedDay(day, today) ?? formatShortDate(day);

/** "Yesterday’s dinner", or "Dinner · Sep 12" once the day has no name of its own. */
export function recentMealTitle(
  day: string,
  meal: FoodEntry['meal'],
  today: string,
): string {
  const named = namedDay(day, today);
  return named
    ? `${named}’s ${mealLabel(meal).toLowerCase()}`
    : `${mealLabel(meal)} · ${formatShortDate(day)}`;
}

/**
 * The meals in your log, newest day first and latest meal first within a day,
 * each one a snapshot ready to add again (portions and food types kept, as in
 * a saved meal).
 *
 * `byDay` is entries grouped by day (YYYY-MM-DD). `fromDay` leaves out
 * anything before that day.
 */
export function recentMeals(
  byDay: Record<string, FoodEntry[]>,
  options: { today: string; fromDay?: string; limit?: number },
): RecentMeal[] {
  const { today, fromDay, limit = 20 } = options;
  const days = Object.keys(byDay)
    .filter((d) => d <= today && (!fromDay || d >= fromDay))
    .sort()
    .reverse();

  const out: RecentMeal[] = [];
  for (const day of days) {
    for (const meal of WITHIN_DAY) {
      const entries = byDay[day].filter((e) => e.meal === meal);
      if (!entries.length) continue;
      out.push({
        id: `${day}-${meal}`,
        day,
        meal,
        title: recentMealTitle(day, meal, today),
        items: snapshotItems(entries),
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Meals whose day, meal name or foods contain every word of `query`; all of them when it's blank. */
export function filterRecentMeals(
  meals: RecentMeal[],
  query: string,
): RecentMeal[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return meals;
  return meals.filter((m) => {
    const hay = `${m.title} ${m.items
      .map((i) => `${i.name} ${i.brand ?? ''}`)
      .join(' ')}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
