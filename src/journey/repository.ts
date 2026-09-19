import { INITIAL_WAYPOINTS } from './mock';
import { waypointRules, type WaypointSource } from './models';

export type WaypointsSnapshot = {
  /** Lifetime total: the sum of every award in the ledger. */
  total: number;
  /** Sources already awarded on the day that was loaded. */
  todaySources: WaypointSource[];
};

/**
 * The waypoints ledger. There is at most one award per source per day, so
 * `award` is idempotent, and taking one back (`revoke`) removes its entry.
 * Awards come from behavior only — see `waypointRules`.
 */
export interface WaypointsRepository {
  load(day: string): Promise<WaypointsSnapshot>;
  award(source: WaypointSource, points: number, day: string): Promise<void>;
  revoke(source: WaypointSource, day: string): Promise<void>;
}

const pointsFor = (source: WaypointSource) =>
  waypointRules.find((r) => r.id === source)?.points ?? 0;

/**
 * Local-mode ledger. `history` is the total from before today; `today` lists
 * awards already made on whichever day is loaded first (the seed food log
 * already covers every meal, so the meals bonus starts out earned).
 */
export function createMemoryWaypointsRepository(
  history: number = INITIAL_WAYPOINTS - pointsFor('meals'),
  today: WaypointSource[] = ['meals'],
): WaypointsRepository {
  const events = new Map<string, number>();
  let seeded = false;
  const key = (source: WaypointSource, day: string) => `${day}:${source}`;

  return {
    load: async (day) => {
      if (!seeded) {
        seeded = true;
        today.forEach((s) => events.set(key(s, day), pointsFor(s)));
      }
      const total = history + [...events.values()].reduce((a, b) => a + b, 0);
      const todaySources = [...events.keys()]
        .filter((k) => k.startsWith(`${day}:`))
        .map((k) => k.split(':')[1] as WaypointSource);
      return { total, todaySources };
    },
    award: async (source, points, day) => {
      if (!events.has(key(source, day))) events.set(key(source, day), points);
    },
    revoke: async (source, day) => {
      events.delete(key(source, day));
    },
  };
}
