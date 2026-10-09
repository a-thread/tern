import { addDays } from '@shared/utils/date';

/** What kind of movement. A closed set, so the database can check it. */
export enum Activity {
  Walk = 'walk',
  Run = 'run',
  Bike = 'bike',
  Swim = 'swim',
  Strength = 'strength',
  Yoga = 'yoga',
  Class = 'class',
  Other = 'other',
}

/** How hard it felt. Optional: plenty of movement isn't worth rating. */
export enum Effort {
  Easy = 'easy',
  Moderate = 'moderate',
  Hard = 'hard',
}

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
  /** Logged by hand, or read from Health Connect (read-only, never stored). */
  source: 'manual' | 'healthConnect';
  loggedAt: string;
};

export class MovementLimits {
  static readonly MIN_MINUTES = 1;
  static readonly MAX_MINUTES = 600;
  /** How the minutes stepper moves. */
  static readonly STEP = 5;
  /** What the quick-add button logs: a walk of this long. */
  static readonly QUICK_MINUTES = 30;
  /** Minutes in a day that make it a goal day, until changed in settings. */
  static readonly DEFAULT_GOAL = 30;
  static readonly GOAL_MIN = 10;
  static readonly GOAL_MAX = 120;
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  [Activity.Walk]: 'Walk',
  [Activity.Run]: 'Run',
  [Activity.Bike]: 'Bike',
  [Activity.Swim]: 'Swim',
  [Activity.Strength]: 'Strength',
  [Activity.Yoga]: 'Yoga',
  [Activity.Class]: 'Class',
  [Activity.Other]: 'Other',
};

export const EFFORT_LABEL: Record<Effort, string> = {
  [Effort.Easy]: 'Easy',
  [Effort.Moderate]: 'Moderate',
  [Effort.Hard]: 'Hard',
};

export const isValidMinutes = (m: number) =>
  Number.isInteger(m) && m >= MovementLimits.MIN_MINUTES && m <= MovementLimits.MAX_MINUTES;

export const clampMinutes = (m: number) =>
  Math.min(Math.max(Math.round(m), MovementLimits.MIN_MINUTES), MovementLimits.MAX_MINUTES);

export const clampMovementGoal = (m: number) =>
  Math.min(Math.max(Math.round(m), MovementLimits.GOAL_MIN), MovementLimits.GOAL_MAX);

/** Movement can be logged by hand for today and yesterday, never further back or ahead. */
export const isLoggableDay = (day: string, today: string) =>
  day === today || day === addDays(today, -1);

/**
 * Whether an activity's minutes count toward a goal day. Walks and runs don't:
 * steps already count them, and counting them again would make a short walk a
 * goal day. Movement is for what steps can't see: swims, rides, lifting, classes.
 */
export const countsTowardGoal = (activity: Activity) =>
  activity !== Activity.Walk && activity !== Activity.Run;

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
