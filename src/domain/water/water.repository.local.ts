import type { LocalDb } from '@shared/backend/localDb';
import { rowToWater } from './water.repository.supabase';
import type { WaterRepository } from './water.repository';

export function createLocalWaterRepository(db: LocalDb): WaterRepository {
  return {
    async load(from, to) {
      return (
        await db.all<Parameters<typeof rowToWater>[0]>(
          `SELECT id, oz, logged_on, logged_at FROM water_entries
           WHERE logged_on BETWEEN ? AND ? ORDER BY logged_at`,
          [from, to],
        )
      ).map(rowToWater);
    },
    async add(entry) {
      await db.run(
        'INSERT INTO water_entries (id, oz, logged_on, logged_at) VALUES (?, ?, ?, ?)',
        [entry.id, entry.oz, entry.loggedOn, entry.loggedAt],
      );
    },
    async remove(id) {
      await db.run('DELETE FROM water_entries WHERE id = ?', [id]);
    },
  };
}
