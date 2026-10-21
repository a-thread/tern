import type { LocalDb } from '@shared/backend/localDb';
import type { WeightEntry } from './models/weightEntry';
import type { WeightRepository } from './weight.repository';

type WeightRow = { id: string; lb: number; logged_at: string };

/** Weigh-ins stored on the phone. Same limits as the Supabase version, so the app sees the same window. */
export function createLocalWeightRepository(db: LocalDb): WeightRepository {
  return {
    async load() {
      const data = await db.all<WeightRow>(
        'SELECT id, lb, logged_at FROM weight_entries ORDER BY logged_at DESC LIMIT 180',
      );
      return data.map(
        (r): WeightEntry => ({ id: r.id, lb: r.lb, loggedAt: r.logged_at }),
      );
    },
    async add(entry) {
      await db.run(
        'INSERT INTO weight_entries (id, lb, logged_at) VALUES (?, ?, ?)',
        [entry.id, entry.lb, entry.loggedAt],
      );
    },
    async update(id, lb) {
      await db.run('UPDATE weight_entries SET lb = ? WHERE id = ?', [lb, id]);
    },
    async loadSkipped() {
      const data = await db.all<{ day: string }>(
        'SELECT day FROM skipped_weigh_ins ORDER BY day DESC LIMIT 30',
      );
      return data.map((r) => r.day);
    },
    async setSkipped(day, skipped) {
      // Primary key (day): marking twice is harmless.
      await db.run(
        skipped
          ? 'INSERT OR IGNORE INTO skipped_weigh_ins (day) VALUES (?)'
          : 'DELETE FROM skipped_weigh_ins WHERE day = ?',
        [day],
      );
    },
  };
}
