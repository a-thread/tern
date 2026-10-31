import { addDays } from '@shared/utils/date';
import { type LedgerEvent } from '@/domain/waypoints/models/waypoint';

export type WaypointStats = {
  /** Days that earned at least one waypoint. */
  days: number;
  /** Waypoints earned over the last 7 days, today included. */
  thisWeek: number;
  /** The day that earned the most, or null before any. The earliest wins a tie. */
  best: { day: string; points: number } | null;
};

/** What the waypoints card says about the ledger, as of `today`. */
export function waypointStats(
  events: readonly LedgerEvent[],
  today: string,
): WaypointStats {
  const byDay = new Map<string, number>();
  for (const e of events) byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.points);
  const weekStart = addDays(today, -6);
  let thisWeek = 0;
  let best: WaypointStats['best'] = null;
  for (const [day, points] of [...byDay].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (day >= weekStart && day <= today) thisWeek += points;
    if (!best || points > best.points) best = { day, points };
  }
  // One entry per day that earned anything, so its size is the day count.
  return { days: byDay.size, thisWeek, best };
}
