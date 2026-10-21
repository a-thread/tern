import type { LocalDb } from '@shared/backend/localDb';
import { Meal } from '../food/models/foodEntry';
import { rowToMealCheckIn } from './mealCheckIns.repository.supabase';
import type { MealCheckInsRepository } from './mealCheckIns.repository';

const MEALS: readonly string[] = Object.values(Meal);

export function createLocalMealCheckInsRepository(
  db: LocalDb,
): MealCheckInsRepository {
  return {
    async load(from, to) {
      return (
        await db.all<Parameters<typeof rowToMealCheckIn>[0]>(
          `SELECT day, meal, fullness, feeling, note FROM meal_checkins
           WHERE day BETWEEN ? AND ? ORDER BY day`,
          [from, to],
        )
      )
        .filter((r) => MEALS.includes(r.meal))
        .map(rowToMealCheckIn);
    },
    async save(entry) {
      // One row per meal and day: checking in again replaces it, note and all.
      await db.run(
        `INSERT OR REPLACE INTO meal_checkins (day, meal, fullness, feeling, note, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entry.day,
          entry.meal,
          entry.fullness,
          entry.feeling,
          entry.note ?? null,
          new Date().toISOString(),
        ],
      );
    },
    async remove(day, meal) {
      await db.run('DELETE FROM meal_checkins WHERE day = ? AND meal = ?', [
        day,
        meal,
      ]);
    },
  };
}
