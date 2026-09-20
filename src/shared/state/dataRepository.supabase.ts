import type { TernClient } from '@shared/backend/supabase';
import type { DataRepository, TernExport } from './dataRepository';

const TABLES = {
  food: 'food_entries',
  weight: 'weight_entries',
  waypoints: 'waypoint_events',
  restDays: 'rest_days',
} as const;

export function createSupabaseDataRepository(db: TernClient): DataRepository {
  const all = async (table: string) => {
    const { data, error } = await db.from(table).select('*');
    if (error) throw error;
    return data ?? [];
  };

  return {
    async exportAll(): Promise<TernExport> {
      const [settings, food, weight, waypoints, restDays] = await Promise.all([
        db.from('settings').select('data').maybeSingle(),
        all(TABLES.food),
        all(TABLES.weight),
        all(TABLES.waypoints),
        all(TABLES.restDays),
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
      };
    },

    async deleteAll() {
      for (const table of [...Object.values(TABLES), 'settings']) {
        const { error } = await db
          .from(table)
          .delete()
          .not('user_id', 'is', null);
        if (error) throw error;
      }
    },
  };
}
