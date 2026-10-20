import type { Meal } from '../food/models/foodEntry';
import type { MealCheckIn } from './models/mealCheckIn';

/** One check-in per meal per local day. */
export interface MealCheckInsRepository {
  /** Check-ins from day `from` to `to` inclusive, oldest first. */
  load(from: string, to: string): Promise<MealCheckIn[]>;
  /** Saves the meal's check-in, replacing any earlier one for that meal and day. */
  save(entry: MealCheckIn): Promise<void>;
  remove(day: string, meal: Meal): Promise<void>;
}

const same = (a: MealCheckIn, day: string, meal: Meal) =>
  a.day === day && a.meal === meal;

export function createMemoryMealCheckInsRepository(): MealCheckInsRepository {
  let entries: MealCheckIn[] = [];
  return {
    load: async (from, to) =>
      entries
        .filter((e) => e.day >= from && e.day <= to)
        .sort((a, b) => a.day.localeCompare(b.day)),
    save: async (entry) => {
      entries = [
        ...entries.filter((e) => !same(e, entry.day, entry.meal)),
        entry,
      ];
    },
    remove: async (day, meal) => {
      entries = entries.filter((e) => !same(e, day, meal));
    },
  };
}
