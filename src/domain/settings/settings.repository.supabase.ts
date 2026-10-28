import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import type { AppSettings } from './models/appSettings';
import type { SettingsRepository } from './settings.repository';

/** The tables anything logged lands in; a row in any of them means the account is in use. */
const LOGGED_TABLES = [
  'food_entries',
  'skipped_meals',
  'saved_meals',
  'weight_entries',
  'skipped_weigh_ins',
  'waypoint_events',
  'rest_days',
  'medication_doses',
  'water_entries',
  'mood_checkins',
  'meal_checkins',
  'movement_entries',
] as const;

export function createSupabaseSettingsRepository(
  db: TernClient,
): SettingsRepository {
  return {
    async load() {
      const { data, error } = await db
        .from('settings')
        .select('data')
        .maybeSingle();
      if (error) throw error;
      return (data?.data as Partial<AppSettings> | undefined) ?? null;
    },
    async save(settings) {
      // user_id defaults to auth.uid(); it's the primary key, so this upserts.
      await ok(
        db
          .from('settings')
          .upsert(
            { data: settings, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
          ),
      );
    },
    async hasLoggedAnything() {
      const found = await Promise.all(
        LOGGED_TABLES.map((table) =>
          rows(db.from(table).select('user_id').limit(1)),
        ),
      );
      return found.some((r) => r.length > 0);
    },
  };
}
