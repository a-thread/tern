import type { LocalDb } from '@shared/backend/localDb';
import type { LedgerEvent, WaypointSource } from './models/waypoint';
import type { WaypointsRepository } from './waypoints.repository';

export function createLocalWaypointsRepository(
  db: LocalDb,
): WaypointsRepository {
  return {
    async load(day) {
      const [[{ total }], today] = await Promise.all([
        db.all<{ total: number | null }>(
          'SELECT SUM(points) AS total FROM waypoint_events',
        ),
        db.all<{ source: WaypointSource }>(
          'SELECT source FROM waypoint_events WHERE day = ?',
          [day],
        ),
      ]);
      return { total: total ?? 0, todaySources: today.map((r) => r.source) };
    },
    async history() {
      return db.all<LedgerEvent>(
        'SELECT source, day, points FROM waypoint_events ORDER BY day',
      );
    },
    async award(source, points, day) {
      // Primary key (source, day): a repeat award is silently ignored.
      await db.run(
        'INSERT OR IGNORE INTO waypoint_events (source, day, points) VALUES (?, ?, ?)',
        [source, day, points],
      );
    },
    async revoke(source, day) {
      await db.run('DELETE FROM waypoint_events WHERE source = ? AND day = ?', [
        source,
        day,
      ]);
    },
  };
}
