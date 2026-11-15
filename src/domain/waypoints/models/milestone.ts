import type { LedgerEvent } from './waypoint';
import {
  type GeoPoint,
  MigrationRoute,
  type RouteStop,
} from './migrationRoute';
import { RouteId, Routes } from './routes';

/** A stop on a route at the running total within one trip that reaches it. */
export type RouteMilestone = {
  id: string;
  name: string;
  note: string;
  facts: string[];
  waypoints: number;
  at: GeoPoint;
};

const toMilestones = (stops: RouteStop[]): RouteMilestone[] =>
  stops.map(({ id, name, note, facts, km, at }) => ({
    id,
    name,
    note,
    facts,
    waypoints: Math.round(km / MigrationRoute.KM_PER_WAYPOINT),
    at,
  }));

const BY_ROUTE = new Map<RouteId, RouteMilestone[]>();

/** A route's stops, each at the running total within one trip that covers its distance. */
export function routeMilestones(route: RouteId = RouteId.Greenland): RouteMilestone[] {
  let stops = BY_ROUTE.get(route);
  if (!stops) {
    stops = toMilestones(Routes.of(route).stops);
    BY_ROUTE.set(route, stops);
  }
  return stops;
}

/** Waypoints in one full migration of a route. */
export const migrationLength = (route: RouteId = RouteId.Greenland) => {
  const stops = routeMilestones(route);
  return stops[stops.length - 1].waypoints;
};

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
  /**
   * The stops of `MigrationRoute`, each at the running total within one trip that
   * covers its distance (`MigrationRoute.KM_PER_WAYPOINT` km a waypoint). After the
   * last stop the next migration begins, so the journey never runs out.
   */
  static readonly STOPS: RouteMilestone[] = routeMilestones(RouteId.Greenland);

  /** Waypoints in one full migration. */
  static readonly MIGRATION_LENGTH = migrationLength(RouteId.Greenland);
}

/** Which migration a total is on (1-based), and how far through it, 0 to 1. */
export function migrationProgress(
  total: number,
  route: RouteId = RouteId.Greenland,
): {
  lap: number;
  progress: number;
} {
  const length = migrationLength(route);
  const t = Math.max(total, 0);
  const lap = Math.floor(t / length) + 1;
  return { lap, progress: (t % length) / length };
}

/**
 * Milestones up to and including the next one to reach, with the day each was
 * reached, found by replaying the ledger in date order. The stops repeat for
 * every migration. A stop counts as reached when `total` has passed it, even
 * if the events that got there are no longer on record (`reachedOn` is then unset).
 */
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

/**
 * The stop `total` has most recently reached, or null before the first one.
 * Between the end of one migration and the first stop of the next, that's the
 * last stop of the migration just finished.
 */
export function latestMilestone(
  total: number,
  route: RouteId = RouteId.Greenland,
): Milestone | null {
  const stops = routeMilestones(route);
  const length = migrationLength(route);
  if (total < stops[0].waypoints) return null;
  const lap = Math.floor(total / length) + 1;
  const within = total % length;
  const stop = [...stops].reverse().find((s) => s.waypoints <= within);
  if (stop) {
    return {
      ...stop,
      id: `${lap}-${stop.id}`,
      waypoints: (lap - 1) * length + stop.waypoints,
      lap,
      reached: true,
    };
  }
  const last = stops[stops.length - 1];
  return {
    ...last,
    id: `${lap - 1}-${last.id}`,
    waypoints: (lap - 1) * length,
    lap: lap - 1,
    reached: true,
  };
}
