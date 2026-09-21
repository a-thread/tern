import type { TernClient } from '@shared/backend/supabase';
import type { WaterEntry } from './models';
import type { WaterRepository } from './repository';

type WaterRow = { id: string; oz: number; logged_on: string; logged_at: string };

export const rowToWater = (row: WaterRow): WaterEntry => ({
  id: row.id,
  oz: Number(row.oz),
  loggedOn: row.logged_on,
  loggedAt: row.logged_at,
});

export function createSupabaseWaterRepository(db: TernClient): WaterRepository {
  return {
    async load(from, to) {
      const { data, error } = await db
        .from('water_entries')
        .select('id, oz, logged_on, logged_at')
        .gte('logged_on', from)
        .lte('logged_on', to)
        .order('logged_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data as WaterRow[]).map(rowToWater);
    },
    async add(entry) {
      const { error } = await db.from('water_entries').insert({
        id: entry.id,
        oz: entry.oz,
        logged_on: entry.loggedOn,
        logged_at: entry.loggedAt,
      });
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await db.from('water_entries').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
