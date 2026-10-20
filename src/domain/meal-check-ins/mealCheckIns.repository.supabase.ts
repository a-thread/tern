import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import { Meal } from '../food/models/foodEntry';
import type { MealCheckIn } from './models/mealCheckIn';
import type { MealCheckInsRepository } from './mealCheckIns.repository';

type MealCheckInRow = {
  day: string;
  meal: string;
  fullness: number;
  feeling: number;
  note: string | null;
};

export const rowToMealCheckIn = (row: MealCheckInRow): MealCheckIn => ({
  day: row.day,
  meal: row.meal as Meal,
  fullness: Number(row.fullness),
  feeling: Number(row.feeling),
  ...(row.note ? { note: row.note } : {}),
});

const MEALS: readonly string[] = Object.values(Meal);

export function createSupabaseMealCheckInsRepository(
  db: TernClient,
): MealCheckInsRepository {
  return {
    async load(from, to) {
      return (
        await rows<MealCheckInRow>(
          db
            .from('meal_checkins')
            .select('day, meal, fullness, feeling, note')
            .gte('day', from)
            .lte('day', to)
            .order('day', { ascending: true })
            .limit(1000),
        )
      )
        .filter((r) => MEALS.includes(r.meal))
        .map(rowToMealCheckIn);
    },
    async save(entry) {
      // One row per meal and day: checking in again replaces it.
      await ok(
        db.from('meal_checkins').upsert(
          {
            day: entry.day,
            meal: entry.meal,
            fullness: entry.fullness,
            feeling: entry.feeling,
            // Null clears a note that was taken out when checking in again.
            note: entry.note ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,day,meal' },
        ),
      );
    },
    async remove(day, meal) {
      await ok(
        db.from('meal_checkins').delete().eq('day', day).eq('meal', meal),
      );
    },
  };
}
