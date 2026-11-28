import { isTodayOrYesterday } from '@shared/utils/date';
import { Units } from '@shared/utils/units';

/** Stored by id: never change one in use. Unknown ids read back as Other. */
export enum Activity {
  Walk = 'walk',
  Run = 'run',
  Hike = 'hike',
  Bike = 'bike',
  Swim = 'swim',
  Strength = 'strength',
  Cleaning = 'cleaning',
  Shoveling = 'shoveling',
  Gardening = 'gardening',
  Dancing = 'dancing',
  Rowing = 'rowing',
  Kayaking = 'kayaking',
  Elliptical = 'elliptical',
  Hiit = 'hiit',
  Circuit = 'circuit',
  Yoga = 'yoga',
  Pilates = 'pilates',
  Stretching = 'stretching',
  PhysicalTherapy = 'physical_therapy',
  Aerobics = 'aerobics',
  Boxing = 'boxing',
  MartialArts = 'martial_arts',
  Basketball = 'basketball',
  Soccer = 'soccer',
  Tennis = 'tennis',
  Pickleball = 'pickleball',
  Volleyball = 'volleyball',
  Golf = 'golf',
  Climbing = 'climbing',
  Skiing = 'skiing',
  Skating = 'skating',
  Other = 'other',
}

/** How hard it felt. */
export enum Effort {
  Easy = 'easy',
  Moderate = 'moderate',
  Hard = 'hard',
}

type ActivityInfo = {
  label: string;
  /**
   * Counted by steps already (walking, running…), so its minutes don't add to a goal day. Can
   * be logged as steps instead, for a walk without the phone.
   */
  inSteps?: boolean;
  /** Offers an optional distance. */
  distance?: boolean;
};

/** Every activity, in the order the list shows them: the everyday ones first. */
export const ACTIVITY_INFO: Record<Activity, ActivityInfo> = {
  [Activity.Walk]: { label: 'Walking', inSteps: true, distance: true },
  [Activity.Run]: { label: 'Running', inSteps: true, distance: true },
  [Activity.Hike]: { label: 'Hiking', inSteps: true, distance: true },
  [Activity.Bike]: { label: 'Biking', distance: true },
  [Activity.Swim]: { label: 'Swimming' },
  [Activity.Strength]: { label: 'Strength training' },
  [Activity.Cleaning]: { label: 'Cleaning' },
  [Activity.Shoveling]: { label: 'Shoveling snow' },
  [Activity.Gardening]: { label: 'Gardening' },
  [Activity.Dancing]: { label: 'Dancing' },
  [Activity.Rowing]: { label: 'Rowing' },
  [Activity.Kayaking]: { label: 'Kayaking', distance: true },
  [Activity.Elliptical]: { label: 'Elliptical' },
  [Activity.Hiit]: { label: 'HIIT' },
  [Activity.Circuit]: { label: 'Circuit training' },
  [Activity.Yoga]: { label: 'Yoga' },
  [Activity.Pilates]: { label: 'Pilates' },
  [Activity.Stretching]: { label: 'Stretching' },
  [Activity.PhysicalTherapy]: { label: 'Physical therapy' },
  [Activity.Aerobics]: { label: 'Aerobics' },
  [Activity.Boxing]: { label: 'Boxing' },
  [Activity.MartialArts]: { label: 'Martial arts' },
  [Activity.Basketball]: { label: 'Basketball' },
  [Activity.Soccer]: { label: 'Soccer' },
  [Activity.Tennis]: { label: 'Tennis' },
  [Activity.Pickleball]: { label: 'Pickleball' },
  [Activity.Volleyball]: { label: 'Volleyball' },
  [Activity.Golf]: { label: 'Golf' },
  [Activity.Climbing]: { label: 'Climbing' },
  [Activity.Skiing]: { label: 'Skiing' },
  [Activity.Skating]: { label: 'Skating' },
  [Activity.Other]: { label: 'Other' },
};

/** Activities in list order. */
export const ACTIVITY_ORDER = Object.keys(ACTIVITY_INFO) as Activity[];

export const ACTIVITY_LABEL = Object.fromEntries(
  ACTIVITY_ORDER.map((a) => [a, ACTIVITY_INFO[a].label]),
) as Record<Activity, string>;

/** The list filtered by a search ("ball" finds basketball, pickleball, volleyball). */
export const searchActivities = (query: string) => {
  const q = query.trim().toLowerCase();
  return q
    ? ACTIVITY_ORDER.filter((a) =>
        ACTIVITY_INFO[a].label.toLowerCase().includes(q),
      )
    : ACTIVITY_ORDER;
};

export enum MovementSource {
  Manual = 'manual',
  HealthConnect = 'healthConnect',
  HealthKit = 'healthKit',
}

export const isFromHealthApp = (source: MovementSource) =>
  source !== MovementSource.Manual;

/** No calories on purpose: burn comes from the adaptive target, never per-workout estimates. */
export type MovementEntry = {
  id: string;
  day: string;
  activity: Activity;
  /** 0 for an entry logged as steps. */
  minutes: number;
  effort: Effort | null;
  distanceM?: number | null;
  /** Steps taken without the phone; added to the day's steps. */
  steps?: number | null;
  /** Health-app entries are read-only and never stored. */
  source: MovementSource;
  loggedAt: string;
};

export class MovementLimits {
  static readonly MIN_MINUTES = 1;
  static readonly MAX_MINUTES = 600;
  static readonly DEFAULT_MINUTES = 30;
  /** 300 km. */
  static readonly MAX_DISTANCE_M = 300_000;
  static readonly MIN_STEPS = 1;
  static readonly MAX_STEPS = 100_000;
  static readonly DEFAULT_STEPS = 500;
  /** How the steps stepper moves. */
  static readonly STEPS_STEP = 100;
}

export const clampSteps = (s: number) =>
  Math.min(
    Math.max(Math.round(s), MovementLimits.MIN_STEPS),
    MovementLimits.MAX_STEPS,
  );

/** How an in-steps activity was measured. */
export enum MovementMeasure {
  Minutes = 'minutes',
  Steps = 'steps',
}

export const MEASURE_LABEL: Record<MovementMeasure, string> = {
  [MovementMeasure.Minutes]: 'Time',
  [MovementMeasure.Steps]: 'Steps',
};

export const isValidSteps = (s: number) =>
  Number.isInteger(s) &&
  s >= MovementLimits.MIN_STEPS &&
  s <= MovementLimits.MAX_STEPS;

/** Minutes, or steps (with 0 minutes) for an in-steps activity; null if it isn't valid. */
export function loggedAmount(
  activity: Activity,
  minutes: number,
  steps: number | null | undefined,
): { minutes: number; steps: number | null } | null {
  if (steps)
    return ACTIVITY_INFO[activity].inSteps && isValidSteps(steps)
      ? { minutes: 0, steps }
      : null;
  return isValidMinutes(minutes) ? { minutes, steps: null } : null;
}

export const isStepsEntry = (e: Pick<MovementEntry, 'steps'>) =>
  (e.steps ?? 0) > 0;

/** Manual steps per day, keyed by day. */
export function stepsByDay(
  entries: readonly MovementEntry[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries)
    if (e.steps) out[e.day] = (out[e.day] ?? 0) + e.steps;
  return out;
}

/** "600 steps" or "1,200 steps". */
export const formatSteps = (n: number) => `${n.toLocaleString('en-US')} steps`;

export const EFFORT_LABEL: Record<Effort, string> = {
  [Effort.Easy]: 'Low',
  [Effort.Moderate]: 'Medium',
  [Effort.Hard]: 'High',
};

export const isValidMinutes = (m: number) =>
  Number.isInteger(m) &&
  m >= MovementLimits.MIN_MINUTES &&
  m <= MovementLimits.MAX_MINUTES;

export const clampMinutes = (m: number) =>
  Math.min(
    Math.max(Math.round(m), MovementLimits.MIN_MINUTES),
    MovementLimits.MAX_MINUTES,
  );

/** Movement can be logged by hand for today and yesterday, never further back or ahead. */
export const isLoggableDay = isTodayOrYesterday;

/** Walks and runs don't: steps already count them. */
export const countsTowardGoal = (activity: Activity) =>
  !ACTIVITY_INFO[activity].inSteps;

/** Minutes moved per day, keyed by day. */
export function minutesByDay(
  entries: readonly MovementEntry[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) out[e.day] = (out[e.day] ?? 0) + e.minutes;
  return out;
}

/** Minutes per day that count toward a goal day (everything but walks and runs). */
export const goalMinutesByDay = (entries: readonly MovementEntry[]) =>
  minutesByDay(entries.filter((e) => countsTowardGoal(e.activity)));

/** Anything logged that day, minutes or steps. */
export const movedOn = (entries: readonly MovementEntry[], day: string) =>
  entries.some((e) => e.day === day && (e.minutes > 0 || isStepsEntry(e)));

export const dayMinutes = (entries: readonly MovementEntry[], day: string) =>
  entries.reduce((sum, e) => (e.day === day ? sum + e.minutes : sum), 0);

/** A day's entries, earliest first. */
export const entriesOn = (entries: readonly MovementEntry[], day: string) =>
  entries
    .filter((e) => e.day === day)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

/** Each activity's share of the minutes, biggest first: "Walk 48% · Swim 30%". */
export function activityShare(
  entries: readonly MovementEntry[],
): { activity: Activity; minutes: number; share: number }[] {
  const total = entries.reduce((s, e) => s + e.minutes, 0);
  if (!total) return [];
  const by = new Map<Activity, number>();
  // Walks logged as steps have no minutes to share.
  for (const e of entries)
    if (e.minutes > 0)
      by.set(e.activity, (by.get(e.activity) ?? 0) + e.minutes);
  return [...by.entries()]
    .map(([activity, minutes]) => ({
      activity,
      minutes,
      share: minutes / total,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/**
 * "35 min swim", or "50 min · swim and walk" for a day with several; steps logged by hand
 * show as "600 steps walking".
 */
export function movementSummary(entries: readonly MovementEntry[]): string {
  const total = entries.reduce((s, e) => s + e.minutes, 0);
  const steps = entries.reduce((s, e) => s + (e.steps ?? 0), 0);
  const kinds = [
    ...new Set(entries.map((e) => ACTIVITY_LABEL[e.activity].toLowerCase())),
  ];
  if (!kinds.length) return '';
  const amounts = [
    total > 0 ? `${total} min` : null,
    steps > 0 ? formatSteps(steps) : null,
  ].filter(Boolean);
  return kinds.length === 1 && amounts.length === 1
    ? `${amounts[0]} ${kinds[0]}`
    : `${amounts.join(' · ')} · ${kinds.join(' and ')}`;
}

const METERS_PER_MILE = 1609.344;

/** Stored meters as miles or kilometers, whichever the person uses. */
export const distanceToDisplay = (m: number, units: Units) =>
  units === Units.Imperial ? m / METERS_PER_MILE : m / 1000;

export const distanceFromDisplay = (value: number, units: Units) =>
  Math.round(units === Units.Imperial ? value * METERS_PER_MILE : value * 1000);

export const distanceUnit = (units: Units) =>
  units === Units.Imperial ? 'mi' : 'km';

/** "2.5 mi", "4 km". */
export const formatDistance = (m: number, units: Units) =>
  `${Number(distanceToDisplay(m, units).toFixed(1))} ${distanceUnit(units)}`;
