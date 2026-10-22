import type { LocalDb, SqlValue } from '@shared/backend/localDb';
import type { FoodEntry } from './models/foodEntry';
import { patchToRow, rowToFood } from './food.repository.supabase';
import type { FoodRepository } from './food.repository';

type LocalFoodRow = Omit<
  Parameters<typeof rowToFood>[0],
  'tier_overridden' | 'measure'
> & { tier_overridden: number; measure: string | null };

// SQLite has no boolean or json: flags are 0/1 and a measure is JSON text.
const fromLocal = (row: LocalFoodRow) =>
  rowToFood({
    ...row,
    tier_overridden: row.tier_overridden === 1,
    measure: row.measure === null ? undefined : JSON.parse(row.measure),
  });

const toLocal = (value: unknown): SqlValue => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object') return JSON.stringify(value);
  return value as string | number;
};

// `created_at` keeps entries in the order they were logged; rowid breaks a tie in the same millisecond.
const SELECT = 'SELECT * FROM food_entries';
const ORDER = 'ORDER BY created_at, rowid';

/** The food log on the phone, every day of it (the memory version keeps only one). */
export function createLocalFoodRepository(db: LocalDb): FoodRepository {
  return {
    async load(day) {
      return (
        await db.all<LocalFoodRow>(`${SELECT} WHERE logged_on = ? ${ORDER}`, [
          day,
        ])
      ).map(fromLocal);
    },
    async history(from, to) {
      const data = await db.all<LocalFoodRow>(
        `${SELECT} WHERE logged_on BETWEEN ? AND ? ORDER BY logged_on, created_at, rowid`,
        [from, to],
      );
      const byDay: Record<string, FoodEntry[]> = {};
      for (const row of data) {
        (byDay[row.logged_on] ??= []).push(fromLocal(row));
      }
      return byDay;
    },
    async add(day, entry) {
      const { id, ...rest } = entry;
      const row: Record<string, unknown> = {
        id,
        logged_on: day,
        ...patchToRow(rest),
        created_at: new Date().toISOString(),
      };
      const columns = Object.keys(row);
      await db.run(
        `INSERT INTO food_entries (${columns.join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
        Object.values(row).map(toLocal),
      );
    },
    async update(id, patch) {
      const row = patchToRow(patch);
      const columns = Object.keys(row);
      if (!columns.length) return;
      await db.run(
        `UPDATE food_entries SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...Object.values(row).map(toLocal), id],
      );
    },
    async remove(id) {
      await db.run('DELETE FROM food_entries WHERE id = ?', [id]);
    },
    async loadSkipped(day) {
      return (
        await db.all<{ meal: FoodEntry['meal'] }>(
          'SELECT meal FROM skipped_meals WHERE day = ?',
          [day],
        )
      ).map((r) => r.meal);
    },
    async skippedHistory(from, to) {
      const data = await db.all<{ day: string; meal: FoodEntry['meal'] }>(
        'SELECT day, meal FROM skipped_meals WHERE day BETWEEN ? AND ?',
        [from, to],
      );
      const out: Record<string, FoodEntry['meal'][]> = {};
      for (const r of data) {
        (out[r.day] ??= []).push(r.meal);
      }
      return out;
    },
    async setSkipped(day, meal, skipped) {
      // Primary key (day, meal): marking twice is harmless.
      await db.run(
        skipped
          ? 'INSERT OR IGNORE INTO skipped_meals (day, meal) VALUES (?, ?)'
          : 'DELETE FROM skipped_meals WHERE day = ? AND meal = ?',
        [day, meal],
      );
    },
  };
}
