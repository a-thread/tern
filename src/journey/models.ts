/** Which waypoint rule an award came from (matches `waypointRules` ids). */
export type WaypointSource = 'steps' | 'meals' | 'rest';

export type Milestone = {
  id: string;
  name: string;
  waypoints: number;
  reached: boolean;
  /** Day key (YYYY-MM-DD) the running total first reached `waypoints`. */
  reachedOn?: string;
};

/** One award in the ledger. */
export type LedgerEvent = { source: WaypointSource; day: string; points: number };

/** The stops along the migration. Thresholds are flavor; nothing here depends on weight or calories. */
export const MILESTONE_STOPS: { id: string; name: string; waypoints: number }[] = [
  { id: 'm1', name: 'Cape Cod', waypoints: 250 },
  { id: 'm2', name: 'Nova Scotia', waypoints: 600 },
  { id: 'm3', name: 'Newfoundland', waypoints: 1000 },
  { id: 'm4', name: 'Iceland', waypoints: 1500 },
  { id: 'm5', name: 'Greenland', waypoints: 2200 },
  { id: 'm6', name: 'The Azores', waypoints: 3000 },
  { id: 'm7', name: 'Cape Town', waypoints: 4000 },
  { id: 'm8', name: 'Weddell Sea', waypoints: 5000 },
];

/**
 * Milestones with the day each was reached, found by replaying the ledger in
 * date order. A stop counts as reached when `total` has passed it, even if
 * the events that got there are no longer on record (`reachedOn` is then unset).
 */
export function milestonesFor(total: number, events: LedgerEvent[]): Milestone[] {
  const ordered = [...events].sort((a, b) => a.day.localeCompare(b.day));
  return MILESTONE_STOPS.map((stop) => {
    if (total < stop.waypoints) return { ...stop, reached: false };
    let running = 0;
    for (const e of ordered) {
      running += e.points;
      if (running >= stop.waypoints)
        return { ...stop, reached: true, reachedOn: e.day };
    }
    return { ...stop, reached: true };
  });
}

/** Distinct days that earned at least one waypoint. */
export function daysWithWaypoints(events: LedgerEvent[]): number {
  return new Set(events.map((e) => e.day)).size;
}

/** Waypoints are earned for behavior only — never for weight or calorie totals. */
export const waypointRules = [
  { id: 'steps', label: 'Reaching your step goal', points: 40 },
  { id: 'meals', label: 'Logging all meals', points: 15 },
  { id: 'rest', label: 'Taking a rest day', points: 10 },
];

