import { addDays } from '@shared/utils/date';
import { INITIAL_WAYPOINTS } from './waypoints.mock';
import { pointsFor, type LedgerEvent, WaypointSource } from './models/waypoint';

export type WaypointsSnapshot = {
  /** Lifetime total: the sum of every award in the ledger. */
  total: number;
  /** Sources already awarded on the day that was loaded. */
  todaySources: WaypointSource[];
};

/** One award per source per day, so `award` is idempotent. */
export interface WaypointsRepository {
  load(day: string): Promise<WaypointsSnapshot>;
  /** Every award on record, in any order — used to date the journey's milestones. */
  history(): Promise<LedgerEvent[]>;
  award(source: WaypointSource, points: number, day: string): Promise<void>;
  revoke(source: WaypointSource, day: string): Promise<void>;
}

/** Spreads `total` points over past days so local mode has a believable journey. */
function syntheticHistory(total: number, today: string): LedgerEvent[] {
  if (total <= 0) return [];
  const n = Math.max(Math.ceil(total / 55), 1);
  const per = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => ({
    source: WaypointSource.Steps as const,
    day: addDays(today, -(n - i) * 2),
    points: i === n - 1 ? total - per * (n - 1) : per,
  }));
}

/**
 * Local-mode ledger. `today` and `yesterday` are awards the seed data has already earned,
 * so opening the app doesn't pay (and celebrate) them again.
 */
const SEEDED_TODAY = [
  WaypointSource.Meals,
  WaypointSource.Breakfast,
  WaypointSource.Lunch,
  WaypointSource.Dinner,
  WaypointSource.Weight,
];
const SEEDED_YESTERDAY = [WaypointSource.Weight];

const pointsOf = (sources: WaypointSource[]) =>
  sources.reduce((sum, s) => sum + pointsFor(s), 0);

export function createMemoryWaypointsRepository(
  history: number = INITIAL_WAYPOINTS -
    pointsOf(SEEDED_TODAY) -
    pointsOf(SEEDED_YESTERDAY),
  today: WaypointSource[] = SEEDED_TODAY,
  yesterday: WaypointSource[] = today === SEEDED_TODAY ? SEEDED_YESTERDAY : [],
): WaypointsRepository {
  let events: LedgerEvent[] = [];
  let seeded = false;

  const seed = (day: string) => {
    if (seeded) return;
    seeded = true;
    const before = addDays(day, -1);
    events = [
      ...syntheticHistory(history, day),
      ...yesterday.map((source) => ({
        source,
        day: before,
        points: pointsFor(source),
      })),
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
