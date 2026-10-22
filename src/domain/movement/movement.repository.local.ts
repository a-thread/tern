import type { LocalDb } from '@shared/backend/localDb';
import { rowToMovement } from './movement.repository.supabase';
import type { MovementRepository } from './movement.repository';

export function createLocalMovementRepository(db: LocalDb): MovementRepository {
  return {
    async load(from, to) {
      return (
        await db.all<Parameters<typeof rowToMovement>[0]>(
          `SELECT id, day, activity, minutes, effort, distance_m, logged_at
           FROM movement_entries WHERE day BETWEEN ? AND ? ORDER BY logged_at`,
          [from, to],
        )
      ).map(rowToMovement);
    },
    async add(entry) {
      await db.run(
        `INSERT INTO movement_entries (id, day, activity, minutes, effort, distance_m, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.day,
          entry.activity,
          entry.minutes,
          entry.effort,
          entry.distanceM ?? null,
          entry.loggedAt,
        ],
      );
    },
    async remove(id) {
      await db.run('DELETE FROM movement_entries WHERE id = ?', [id]);
    },
  };
}
