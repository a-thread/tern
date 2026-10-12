import type { LedgerEvent } from './waypoint';

export type Milestone = {
  id: string;
  name: string;
  /** A line about the place, for the card that celebrates reaching it. */
  note: string;
  /** The running total that reaches this stop. */
  waypoints: number;
  /** Which migration this stop is on: 1 for the first trip, 2 for the second… */
  lap: number;
  reached: boolean;
  /** Day key (YYYY-MM-DD) the running total first reached `waypoints`. */
  reachedOn?: string;
};

/** The stops on one migration. */
export class Milestones {
  /**
  * One full migration, roughly as tracked Greenland terns fly it: south from
  * the colony, down the African coast to the Weddell Sea, and home again up the
  * middle of the Atlantic. Thresholds are the running total within one trip;
  * after the last stop the next migration begins, so the journey never runs
  * out. Nothing here depends on weight or calories.
  */
  static readonly STOPS: { id: string; name: string; note: string; waypoints: number }[] = [
    {
      id: 'iceland',
      name: 'Iceland',
      note: 'Iceland is home to one of the largest Arctic tern colonies anywhere.',
      waypoints: 250,
    },
    {
      id: 'north-atlantic',
      name: 'The North Atlantic stopover',
      note: 'Tracked terns pause out here for weeks, feeding up before the long run south.',
      waypoints: 600,
    },
    {
      id: 'azores',
      name: 'The Azores',
      note: 'Islands in the middle of the ocean, a rare patch of land on the way south.',
      waypoints: 1000,
    },
    {
      id: 'cape-verde',
      name: 'Cape Verde',
      note: 'Off West Africa the route splits: some terns cross toward Brazil, others keep to the African coast.',
      waypoints: 1500,
    },
    {
      id: 'namibia',
      name: 'The Namibian coast',
      note: 'A cold current along this coast brings up plenty of food for passing seabirds.',
      waypoints: 2200,
    },
    {
      id: 'cape-town',
      name: 'Cape Town',
      note: 'At the tip of Africa, the route turns toward the Southern Ocean.',
      waypoints: 3000,
    },
    {
      id: 'weddell',
      name: 'The Weddell Sea',
      note: 'Terns spend the southern summer here by the pack ice, in almost constant daylight.',
      waypoints: 4000,
    },
    {
      id: 'south-georgia',
      name: 'South Georgia',
      note: 'A wild island famous for its seabirds, passed on the way back north.',
      waypoints: 4700,
    },
    {
      id: 'mid-atlantic',
      name: 'The mid-Atlantic',
      note: 'Heading home, terns fly up the middle of the ocean in a wide S, riding the winds.',
      waypoints: 5600,
    },
    {
      id: 'newfoundland',
      name: 'Newfoundland',
      note: 'The last long stretch, past Newfoundland and on toward the Arctic.',
      waypoints: 6600,
    },
    {
      id: 'greenland',
      name: 'Home to Greenland',
      note: 'Back at the colony, where terns return to nest year after year, often to the same spot.',
      waypoints: 7600,
    },
  ];

  /** Waypoints in one full migration. */
  static readonly MIGRATION_LENGTH = Milestones.STOPS[Milestones.STOPS.length - 1].waypoints;
}

/** Which migration a total is on (1-based), and how far through it, 0 to 1. */
export function migrationProgress(total: number): { lap: number; progress: number } {
  const t = Math.max(total, 0);
  const lap = Math.floor(t / Milestones.MIGRATION_LENGTH) + 1;
  return { lap, progress: (t % Milestones.MIGRATION_LENGTH) / Milestones.MIGRATION_LENGTH };
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
    for (const stop of Milestones.STOPS) {
      const waypoints = (lap - 1) * Milestones.MIGRATION_LENGTH + stop.waypoints;
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
  if (total < Milestones.STOPS[0].waypoints) return null;
  const lap = Math.floor(total / Milestones.MIGRATION_LENGTH) + 1;
  const within = total % Milestones.MIGRATION_LENGTH;
  const stop = [...Milestones.STOPS].reverse().find((s) => s.waypoints <= within);
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