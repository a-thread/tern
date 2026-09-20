import { addDays } from '@shared/utils/date';
import { INITIAL_WAYPOINTS } from './mock';
import { waypointRules, type LedgerEvent, type WaypointSource } from './models';

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
  /** Every award on record, in any order — used to date the journey's milestones. */
  history(): Promise<LedgerEvent[]>;
  award(source: WaypointSource, points: number, day: string): Promise<void>;
  revoke(source: WaypointSource, day: string): Promise<void>;
}

const pointsFor = (source: WaypointSource) =>
  waypointRules.find((r) => r.id === source)?.points ?? 0;

/** Spreads `total` points over past days so local mode has a believable journey. */
function syntheticHistory(total: number, today: string): LedgerEvent[] {
  if (total <= 0) return [];
  const n = Math.max(Math.ceil(total / 55), 1);
  const per = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => ({
    source: 'steps' as const,
    day: addDays(today, -(n - i) * 2),
    points: i === n - 1 ? total - per * (n - 1) : per,
  }));
}

/**
 * Local-mode ledger. `history` is the total from before today; `today` lists
 * awards already made on whichever day is loaded first (the seed food log
 * already covers every meal, so the meals bonus starts out earned).
 */
export function createMemoryWaypointsRepository(
  history: number = INITIAL_WAYPOINTS - pointsFor('meals'),
  today: WaypointSource[] = ['meals'],
): WaypointsRepository {
  let events: LedgerEvent[] = [];
  let seeded = false;

  const seed = (day: string) => {
    if (seeded) return;
    seeded = true;
    events = [
      ...syntheticHistory(history, day),
      ...today.map((source) => ({ source, day, points: pointsFor(source) })),
    ];
  };

  return {
    load: async (day) => {
      seed(day);
      return {
        total: events.reduce((sum, e) => sum + e.points, 0),
        todaySources: events.filter((e) => e.day === day).map((e) => e.source),
      };
    },
    history: async () => [...events],
    award: async (source, points, day) => {
      if (!events.some((e) => e.source === source && e.day === day)) {
        events.push({ source, day, points });
      }
    },
    revoke: async (source, day) => {
      events = events.filter((e) => !(e.source === source && e.day === day));
    },
  };
}
