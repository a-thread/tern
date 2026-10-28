import type { LedgerEvent } from './waypoint';

export type Milestone = {
  id: string;
  name: string;
  /** A line about the place, for the card that celebrates reaching it. */
  note: string;
  /** A few short facts about the place, for its card on Journey. */
  facts: string[];
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
  static readonly STOPS: {
    id: string;
    name: string;
    note: string;
    facts: string[];
    waypoints: number;
  }[] = [
    {
      id: 'iceland',
      name: 'Iceland',
      note: 'Iceland is home to one of the largest Arctic tern colonies anywhere.',
      waypoints: 250,
      facts: [
        'Icelanders call the Arctic tern kría, after the sound of its call.',
        'Nesting terns dive at anyone who walks too close, so walkers near colonies sometimes hold a stick above their heads.',
        'In midsummer the sun barely sets here, so terns can fish almost around the clock.',
      ],
    },
    {
      id: 'north-atlantic',
      name: 'The North Atlantic stopover',
      note: 'Tracked terns pause out here for weeks, feeding up before the long run south.',
      waypoints: 600,
      facts: [
        'This stopover was only discovered in 2010, when tiny trackers on Greenland terns showed them circling this patch of ocean.',
        'Terns spend around three weeks out here, feeding up before the long run south.',
      ],
    },
    {
      id: 'azores',
      name: 'The Azores',
      note: 'Islands in the middle of the ocean, a rare patch of land on the way south.',
      waypoints: 1000,
      facts: [
        'The Azores are nine volcanic islands, about 1,400 km west of Portugal.',
        'Common and roseate terns nest here, and the islands are one of the most important places in Europe for roseate terns.',
      ],
    },
    {
      id: 'cape-verde',
      name: 'Cape Verde',
      note: 'Off West Africa the route splits: some terns cross toward Brazil, others keep to the African coast.',
      waypoints: 1500,
      facts: [
        'Ten volcanic islands sit about 570 km off the coast of West Africa.',
        'The Cape Verde shearwater, a seabird that breeds nowhere else in the world, nests on these islands.',
      ],
    },
    {
      id: 'namibia',
      name: 'The Namibian coast',
      note: 'A cold current along this coast brings up plenty of food for passing seabirds.',
      waypoints: 2200,
      facts: [
        'The cold Benguela Current flows north along this coast, carrying rich water up from the deep.',
        'The Namib, one of the oldest deserts on Earth, runs right down to the sea here.',
        'Damara terns, among the smallest terns in the world, nest on the gravel plains near the shore.',
      ],
    },
    {
      id: 'cape-town',
      name: 'Cape Town',
      note: 'At the tip of Africa, the route turns toward the Southern Ocean.',
      waypoints: 3000,
      facts: [
        'Many say the Atlantic and Indian Oceans meet at Cape Point, though the official line is at Cape Agulhas, further east.',
        'Antarctic terns, close cousins of the Arctic tern, spend the southern winter on these shores.',
      ],
    },
    {
      id: 'weddell',
      name: 'The Weddell Sea',
      note: 'Terns spend the southern summer here by the pack ice, in almost constant daylight.',
      waypoints: 4000,
      facts: [
        'The sea is named after James Weddell, a British sealer who sailed into it in 1823.',
        "Shackleton's ship Endurance was crushed by its ice in 1915. The wreck was found in 2022, about 3,000 m down.",
        'With summer at both ends of the trip, Arctic terns see more daylight than any other animal.',
      ],
    },
    {
      id: 'south-georgia',
      name: 'South Georgia',
      note: 'A wild island famous for its seabirds, passed on the way back north.',
      waypoints: 4700,
      facts: [
        "The explorer Ernest Shackleton is buried at Grytviken, the island's old whaling station.",
        'Millions of seabirds, seals and penguins breed here, including king penguins and wandering albatrosses.',
      ],
    },
    {
      id: 'mid-atlantic',
      name: 'The mid-Atlantic',
      note: 'Heading home, terns fly up the middle of the ocean in a wide S, riding the winds.',
      waypoints: 5600,
      facts: [
        'The trip home is much quicker than the trip south: about 40 days instead of about 90.',
        'Far below runs the Mid-Atlantic Ridge, the longest mountain range on Earth, almost all of it under water.',
      ],
    },
    {
      id: 'newfoundland',
      name: 'Newfoundland',
      note: 'The last long stretch, past Newfoundland and on toward the Arctic.',
      waypoints: 6600,
      facts: [
        'Arctic terns and common terns both nest along these coasts.',
        'In spring, icebergs from Greenland drift past here along what locals call Iceberg Alley.',
      ],
    },
    {
      id: 'greenland',
      name: 'Home to Greenland',
      note: 'Back at the colony, where terns return to nest year after year, often to the same spot.',
      waypoints: 7600,
      facts: [
        'Tracked Greenland terns flew about 70,900 km in a year, the longest migration then recorded for any animal.',
        'Arctic terns can live for more than 30 years, and a lifetime of migrations adds up to about three trips to the Moon and back.',
      ],
    },
  ];

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
