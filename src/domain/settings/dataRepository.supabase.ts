import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import type { DataRepository } from './dataRepository';
import type { TernExport } from './models/ternExport';

const TABLES = {
  food: 'food_entries',
  weight: 'weight_entries',
  waypoints: 'waypoint_events',
  restDays: 'rest_days',
  savedMeals: 'saved_meals',
  medicationDoses: 'medication_doses',
  waterEntries: 'water_entries',
  moodCheckins: 'mood_checkins',
  mealCheckins: 'meal_checkins',
  skippedMeals: 'skipped_meals',
  skippedWeighIns: 'skipped_weigh_ins',
  movementEntries: 'movement_entries',
} as const;

/** Each table's key, so paging through it in that order skips and repeats nothing. */
const KEYS: Record<(typeof TABLES)[keyof typeof TABLES], string[]> = {
  food_entries: ['id'],
  weight_entries: ['id'],
  waypoint_events: ['id'],
  rest_days: ['day'],
  saved_meals: ['id'],
  medication_doses: ['medication_id', 'day'],
  water_entries: ['id'],
  mood_checkins: ['day'],
  meal_checkins: ['day', 'meal'],
  skipped_meals: ['day', 'meal'],
  skipped_weigh_ins: ['day'],
  movement_entries: ['id'],
};

// The server caps how many rows one request returns (1000 by default), so a table is read
// a page at a time until a page comes back empty, whatever that cap is set to.
const PAGE = 1000;

export function createSupabaseDataRepository(db: TernClient): DataRepository {
  const all = async (table: keyof typeof KEYS) => {
    const found: Record<string, unknown>[] = [];
    for (;;) {
      let query = db.from(table).select('*');
      for (const key of KEYS[table]) query = query.order(key);
      const page = await rows<Record<string, unknown>>(
        query.range(found.length, found.length + PAGE - 1),
      );
      if (page.length === 0) return found;
      found.push(...page);
    }
  };

  return {
    async exportAll(): Promise<TernExport> {
      const [
        settings,
        food,
        weight,
        waypoints,
        restDays,
        savedMeals,
        medicationDoses,
        waterEntries,
        moodCheckins,
        mealCheckins,
        skippedMeals,
        skippedWeighIns,
        movementEntries,
      ] = await Promise.all([
        db.from('settings').select('data').maybeSingle(),
        all(TABLES.food),
        all(TABLES.weight),
        all(TABLES.waypoints),
        all(TABLES.restDays),
        all(TABLES.savedMeals),
        all(TABLES.medicationDoses),
        all(TABLES.waterEntries),
        all(TABLES.moodCheckins),
        all(TABLES.mealCheckins),
        all(TABLES.skippedMeals),
        all(TABLES.skippedWeighIns),
        all(TABLES.movementEntries),
      ]);
      if (settings.error) throw settings.error;
      return {
        exportedAt: new Date().toISOString(),
        weightUnit: 'lb',
        settings: settings.data?.data ?? null,
        food,
        weight,
        waypoints,
        restDays,
        savedMeals,
        medicationDoses,
        waterEntries,
        moodCheckins,
        mealCheckins,
        skippedMeals,
        skippedWeighIns,
        movementEntries,
      };
    },

    async deleteAll() {
      for (const table of [...Object.values(TABLES), 'settings']) {
        await ok(db.from(table).delete().not('user_id', 'is', null));
      }
    },

    async deleteAccount() {
      // Server-side function (supabase/migrations/20260922000000_delete_account.sql):
      // removing the login cascades to every row of the account.
      await ok(db.rpc('delete_my_account'));
    },

    async importAll(copy) {
      // Server-side function (supabase/migrations/20261022000000_import_my_data.sql): it
      // adds past days too, which the tables only accept from it.
      const { data, error } = await db.rpc('import_my_data', { copy });
      if (error) throw error;
      return Number(data ?? 0);
    },
  };
}
