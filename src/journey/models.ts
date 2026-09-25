/** Which waypoint rule an award came from (matches `waypointRules` ids). */
export type WaypointSource = 'steps' | 'meals' | 'rest' | 'water' | 'mood';

export type Milestone = {
  id: string;
  name: string;
  /** The running total that reaches this stop. */
  waypoints: number;
  /** Which migration this stop is on: 1 for the first trip, 2 for the second… */
  lap: number;
  reached: boolean;
  /** Day key (YYYY-MM-DD) the running total first reached `waypoints`. */
  reachedOn?: string;
};

/** One award in the ledger. */
export type LedgerEvent = { source: WaypointSource; day: string; points: number };

/**
 * One full migration, roughly as tracked Greenland terns fly it: south from
 * the colony, down the African coast to the Weddell Sea, and home again up the
 * middle of the Atlantic. Thresholds are the running total within one trip;
 * after the last stop the next migration begins, so the journey never runs
 * out. Nothing here depends on weight or calories.
 */
export const MILESTONE_STOPS: { id: string; name: string; waypoints: number }[] = [
  { id: 'iceland', name: 'Iceland', waypoints: 250 },
  { id: 'north-atlantic', name: 'The North Atlantic stopover', waypoints: 600 },
  { id: 'azores', name: 'The Azores', waypoints: 1000 },
  { id: 'cape-verde', name: 'Cape Verde', waypoints: 1500 },
  { id: 'namibia', name: 'The Namibian coast', waypoints: 2200 },
  { id: 'cape-town', name: 'Cape Town', waypoints: 3000 },
  { id: 'weddell', name: 'The Weddell Sea', waypoints: 4000 },
  { id: 'south-georgia', name: 'South Georgia', waypoints: 4700 },
  { id: 'mid-atlantic', name: 'The mid-Atlantic', waypoints: 5600 },
  { id: 'newfoundland', name: 'Newfoundland', waypoints: 6600 },
  { id: 'greenland', name: 'Home to Greenland', waypoints: 7600 },
];

/** Waypoints in one full migration. */
export const MIGRATION_LENGTH = MILESTONE_STOPS[MILESTONE_STOPS.length - 1].waypoints;

/** Which migration a total is on (1-based), and how far through it, 0 to 1. */
export function migrationProgress(total: number): { lap: number; progress: number } {
  const t = Math.max(total, 0);
  const lap = Math.floor(t / MIGRATION_LENGTH) + 1;
  return { lap, progress: (t % MIGRATION_LENGTH) / MIGRATION_LENGTH };
}

/**
 * Milestones up to and including the next one to reach, with the day each was
 * reached, found by replaying the ledger in date order. The stops repeat for
 * every migration. A stop counts as reached when `total` has passed it, even
 * if the events that got there are no longer on record (`reachedOn` is then unset).
 */
export function milestonesFor(total: number, events: LedgerEvent[]): Milestone[] {
  const ordered = [...events].sort((a, b) => a.day.localeCompare(b.day));
  const out: Milestone[] = [];
  let i = 0;
  let running = 0;
  for (let lap = 1; ; lap++) {
    for (const stop of MILESTONE_STOPS) {
      const waypoints = (lap - 1) * MIGRATION_LENGTH + stop.waypoints;
      const base = { ...stop, id: `${lap}-${stop.id}`, waypoints, lap };
      if (total < waypoints) {
        out.push({ ...base, reached: false });
        return out;
      }
      // Stops are in increasing order, so the replay carries on from the last one.
      while (running < waypoints && i < ordered.length) running += ordered[i++].points;
      out.push(
        running >= waypoints
          ? { ...base, reached: true, reachedOn: ordered[i - 1].day }
          : { ...base, reached: true },
      );
    }
  }
}

/**
 * The stop `total` has most recently reached, or null before the first one.
 * Between the end of one migration and the first stop of the next, that's the
 * last stop of the migration just finished.
 */
export function latestMilestone(total: number): Milestone | null {
  if (total < MILESTONE_STOPS[0].waypoints) return null;
  const lap = Math.floor(total / MIGRATION_LENGTH) + 1;
  const within = total % MIGRATION_LENGTH;
  const stop = [...MILESTONE_STOPS].reverse().find((s) => s.waypoints <= within);
  if (stop) {
    return {
      ...stop,
      id: `${lap}-${stop.id}`,
      waypoints: (lap - 1) * MIGRATION_LENGTH + stop.waypoints,
      lap,
      reached: true,
    };
  }
  const last = MILESTONE_STOPS[MILESTONE_STOPS.length - 1];
  return {
    ...last,
    id: `${lap - 1}-${last.id}`,
    waypoints: (lap - 1) * MIGRATION_LENGTH,
    lap: lap - 1,
    reached: true,
  };
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
  { id: 'water', label: 'Reaching your water goal', points: 10 },
  { id: 'mood', label: 'Checking in on mood and stress', points: 10 },
];

