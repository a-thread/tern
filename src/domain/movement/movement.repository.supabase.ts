import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import {
  Activity,
  Effort,
  type MovementEntry,
} from './models/movementEntry';
import type { MovementRepository } from './movement.repository';

type MovementRow = {
  id: string;
  day: string;
  activity: string;
  minutes: number;
  effort: string | null;
  distance_m: number | null;
  logged_at: string;
};

const ACTIVITIES = new Set<string>(Object.values(Activity));
const EFFORTS = new Set<string>(Object.values(Effort));

export const rowToMovement = (row: MovementRow): MovementEntry => ({
  id: row.id,
  day: row.day,
  activity: ACTIVITIES.has(row.activity)
    ? (row.activity as Activity)
    : Activity.Other,
  minutes: Number(row.minutes),
  effort: row.effort && EFFORTS.has(row.effort) ? (row.effort as Effort) : null,
  distanceM: row.distance_m ?? null,
  source: 'manual',
  loggedAt: row.logged_at,
});

export function createSupabaseMovementRepository(
  db: TernClient,
): MovementRepository {
  return {
    async load(from, to) {
      return (
        await rows<MovementRow>(
          db
            .from('movement_entries')
            .select('id, day, activity, minutes, effort, distance_m, logged_at')
            .gte('day', from)
            .lte('day', to)
            .order('logged_at', { ascending: true })
            .limit(5000),
        )
      ).map(rowToMovement);
    },
    async add(entry) {
      await ok(
        db
          .from('movement_entries')
          .insert({
            id: entry.id,
            day: entry.day,
            activity: entry.activity,
            minutes: entry.minutes,
            effort: entry.effort,
            distance_m: entry.distanceM ?? null,
            logged_at: entry.loggedAt,
          }),
      );
    },
    async remove(id) {
      await ok(db.from('movement_entries').delete().eq('id', id));
    },
  };
}
