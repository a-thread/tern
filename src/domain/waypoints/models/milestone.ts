import type { LedgerEvent } from './waypoint';
import { type GeoPoint, MigrationRoute } from './migrationRoute';

export type Milestone = {
  id: string;
  name: string;
  /** A line about the place, for the card that celebrates reaching it. */
  note: string;
  /** A few short facts about the place, for its card on Journey. */
  facts: string[];
  /** The running total that reaches this stop. */
  waypoints: number;
  /** Where the stop is, for the map on Journey. */
  at: GeoPoint;
  /** Which migration this stop is on: 1 for the first trip, 2 for the second… */
  lap: number;
  reached: boolean;
  /** Day key (YYYY-MM-DD) the running total first reached `waypoints`. */
  reachedOn?: string;
};

/** The stops on one migration. */
export class Milestones {
  /** Running waypoint totals within one migration; after the last, the next one begins. */
  static readonly STOPS: {
    id: string;
    name: string;
    note: string;
    facts: string[];
    waypoints: number;
    at: GeoPoint;
  }[] = MigrationRoute.STOPS.map(({ id, name, note, facts, km, at }) => ({
    id,
    name,
    note,
    facts,
    waypoints: Math.round(km / MigrationRoute.KM_PER_WAYPOINT),
    at,
  }));

  /** Waypoints in one full migration. */
  static readonly MIGRATION_LENGTH =
    Milestones.STOPS[Milestones.STOPS.length - 1].waypoints;
}

/** Which migration a total is on (1-based), and how far through it, 0 to 1. */
export function migrationProgress(total: number): {
  lap: number;
  progress: number;
} {
  const t = Math.max(total, 0);
  const lap = Math.floor(t / Milestones.MIGRATION_LENGTH) + 1;
  return {
    lap,
    progress: (t % Milestones.MIGRATION_LENGTH) / Milestones.MIGRATION_LENGTH,
  };
}

/** Through the next one, dated by replaying the ledger; `reachedOn` is unset when events are missing. */
export function milestonesFor(
  total: number,
  events: LedgerEvent[],
): Milestone[] {
  const ordered = [...events].sort((a, b) => a.day.localeCompare(b.day));
  const out: Milestone[] = [];
  let i = 0;
  let running = 0;
  for (let lap = 1; ; lap++) {
    for (const stop of Milestones.STOPS) {
      const waypoints =
        (lap - 1) * Milestones.MIGRATION_LENGTH + stop.waypoints;
      const base = { ...stop, id: `${lap}-${stop.id}`, waypoints, lap };
      if (total < waypoints) {
        out.push({ ...base, reached: false });
        return out;
      }
      // Stops are in increasing order, so the replay carries on from the last one.
      while (running < waypoints && i < ordered.length)
        running += ordered[i++].points;
      out.push(
        running >= waypoints
          ? { ...base, reached: true, reachedOn: ordered[i - 1].day }
          : { ...base, reached: true },
      );
    }
  }
}

/** Null before the first stop; between migrations, the last stop of the one just finished. */
export function latestMilestone(total: number): Milestone | null {
  if (total < Milestones.STOPS[0].waypoints) return null;
  const lap = Math.floor(total / Milestones.MIGRATION_LENGTH) + 1;
  const within = total % Milestones.MIGRATION_LENGTH;
  const stop = [...Milestones.STOPS]
    .reverse()
    .find((s) => s.waypoints <= within);
  if (stop) {
    return {
      ...stop,
      id: `${lap}-${stop.id}`,
      waypoints: (lap - 1) * Milestones.MIGRATION_LENGTH + stop.waypoints,
      lap,
      reached: true,
    };
  }
  const last = Milestones.STOPS[Milestones.STOPS.length - 1];
  return {
    ...last,
    id: `${lap - 1}-${last.id}`,
    waypoints: (lap - 1) * Milestones.MIGRATION_LENGTH,
    lap: lap - 1,
    reached: true,
  };
}
