import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import type { WaterEntry } from './models/waterEntry';
import type { WaterRepository } from './water.repository';

type WaterRow = {
  id: string;
  oz: number;
  logged_on: string;
  logged_at: string;
};

export const rowToWater = (row: WaterRow): WaterEntry => ({
  id: row.id,
  oz: Number(row.oz),
  loggedOn: row.logged_on,
  loggedAt: row.logged_at,
});

export function createSupabaseWaterRepository(db: TernClient): WaterRepository {
  return {
    async load(from, to) {
      return (
        await rows<WaterRow>(
          db
            .from('water_entries')
            .select('id, oz, logged_on, logged_at')
            .gte('logged_on', from)
            .lte('logged_on', to)
            .order('logged_at', { ascending: true })
            .limit(5000),
        )
      ).map(rowToWater);
    },
    async add(entry) {
      await ok(
        db
          .from('water_entries')
          .insert({
            id: entry.id,
            oz: entry.oz,
            logged_on: entry.loggedOn,
            logged_at: entry.loggedAt,
          }),
      );
    },
    async remove(id) {
      await ok(db.from('water_entries').delete().eq('id', id));
    },
  };
}
