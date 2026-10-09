import { isTodayOrYesterday } from '@shared/utils/date';
import { Units } from '@shared/utils/units';

/**
 * What kind of movement. Stored by id, so an id never changes once it is in use;
 * add new ones freely, and anything unknown reads back as Other.
 */
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
  /** Counted by steps already (walking, running…), so it doesn't add to a goal day. */
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
  return q ? ACTIVITY_ORDER.filter((a) => ACTIVITY_INFO[a].label.toLowerCase().includes(q)) : ACTIVITY_ORDER;
};

/**
 * One stretch of movement on a day. No calories: what someone burns shows up
 * in the adaptive target, from their own log and weight trend, never from a
 * per-workout estimate. `day` is the local day (YYYY-MM-DD).
 */
export type MovementEntry = {
  id: string;
  day: string;
  activity: Activity;
  minutes: number;
  effort: Effort | null;
  /** Optional, in meters (miles or kilometers are a display choice). */
  distanceM?: number | null;
  /** Logged by hand, or read from Health Connect (read-only, never stored). */
  source: 'manual' | 'healthConnect';
  loggedAt: string;
};

export class MovementLimits {
  static readonly MIN_MINUTES = 1;
  static readonly MAX_MINUTES = 600;
  /** What a new entry starts at. */
  static readonly DEFAULT_MINUTES = 30;
  /** How the goal stepper moves. */
  static readonly STEP = 5;
  /** Minutes in a day that make it a goal day, until changed in settings. */
  static readonly DEFAULT_GOAL = 30;
  static readonly GOAL_MIN = 10;
  static readonly GOAL_MAX = 120;
  /** The longest distance an entry can hold: 300 km. */
  static readonly MAX_DISTANCE_M = 300_000;
}

export const EFFORT_LABEL: Record<Effort, string> = {
  [Effort.Easy]: 'Low',
  [Effort.Moderate]: 'Medium',
  [Effort.Hard]: 'High',
};

export const isValidMinutes = (m: number) =>
  Number.isInteger(m) && m >= MovementLimits.MIN_MINUTES && m <= MovementLimits.MAX_MINUTES;

export const clampMinutes = (m: number) =>
  Math.min(Math.max(Math.round(m), MovementLimits.MIN_MINUTES), MovementLimits.MAX_MINUTES);

export const clampMovementGoal = (m: number) =>
  Math.min(Math.max(Math.round(m), MovementLimits.GOAL_MIN), MovementLimits.GOAL_MAX);

/** Movement can be logged by hand for today and yesterday, never further back or ahead. */
export const isLoggableDay = isTodayOrYesterday;

/**
 * Whether an activity's minutes count toward a goal day. Walks and runs don't:
 * steps already count them, and counting them again would make a short walk a
 * goal day. Movement is for what steps can't see: swims, rides, lifting, classes.
 */
export const countsTowardGoal = (activity: Activity) => !ACTIVITY_INFO[activity].inSteps;

/** Minutes moved per day, keyed by day. */
export function minutesByDay(entries: readonly MovementEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) out[e.day] = (out[e.day] ?? 0) + e.minutes;
  return out;
}

/** Minutes per day that count toward a goal day (everything but walks and runs). */
export const goalMinutesByDay = (entries: readonly MovementEntry[]) =>
  minutesByDay(entries.filter((e) => countsTowardGoal(e.activity)));

export const dayMinutes = (entries: readonly MovementEntry[], day: string) =>
  entries.reduce((sum, e) => (e.day === day ? sum + e.minutes : sum), 0);

/** A day's entries, earliest first. */
export const entriesOn = (entries: readonly MovementEntry[], day: string) =>
  entries.filter((e) => e.day === day).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

/** Each activity's share of the minutes, biggest first: "Walk 48% · Swim 30%". */
export function activityShare(
  entries: readonly MovementEntry[],
): { activity: Activity; minutes: number; share: number }[] {
  const total = entries.reduce((s, e) => s + e.minutes, 0);
  if (!total) return [];
  const by = new Map<Activity, number>();
  for (const e of entries) by.set(e.activity, (by.get(e.activity) ?? 0) + e.minutes);
  return [...by.entries()]
    .map(([activity, minutes]) => ({ activity, minutes, share: minutes / total }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** "35 min swim", or "50 min · swim and walk" for a day with several. */
export function movementSummary(entries: readonly MovementEntry[]): string {
  const total = entries.reduce((s, e) => s + e.minutes, 0);
  const kinds = [...new Set(entries.map((e) => ACTIVITY_LABEL[e.activity].toLowerCase()))];
  if (!kinds.length) return '';
  return kinds.length === 1 ? `${total} min ${kinds[0]}` : `${total} min · ${kinds.join(' and ')}`;
}

const METERS_PER_MILE = 1609.344;

/** Stored meters as miles or kilometers, whichever the person uses. */
export const distanceToDisplay = (m: number, units: Units) =>
  units === Units.Imperial ? m / METERS_PER_MILE : m / 1000;

export const distanceFromDisplay = (value: number, units: Units) =>
  Math.round(units === Units.Imperial ? value * METERS_PER_MILE : value * 1000);

export const distanceUnit = (units: Units) => (units === Units.Imperial ? 'mi' : 'km');

/** "2.5 mi", "4 km". */
export const formatDistance = (m: number, units: Units) =>
  `${Number(distanceToDisplay(m, units).toFixed(1))} ${distanceUnit(units)}`;
