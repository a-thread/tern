import type { LocalDb } from '@shared/backend/localDb';
import type { RestDaysRepository } from './restDays.repository';

export function createLocalRestDaysRepository(db: LocalDb): RestDaysRepository {
  return {
    async load(from, to) {
      return (
        await db.all<{ day: string }>(
          'SELECT day FROM rest_days WHERE day BETWEEN ? AND ?',
          [from, to],
        )
      ).map((r) => r.day);
    },
    async add(day) {
      await db.run('INSERT OR IGNORE INTO rest_days (day) VALUES (?)', [day]);
    },
    async remove(day) {
      await db.run('DELETE FROM rest_days WHERE day = ?', [day]);
    },
  };
}
