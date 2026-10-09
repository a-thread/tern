import { Milestones, milestonesFor, type Milestone } from './milestone';
import { pointsFor, WaypointSource, type LedgerEvent } from './waypoint';

/** One line of "today" on the waypoints card: what was earned, and for how much. */
export type EarnedLine = { label: string; points: number };

const LABELS: Partial<Record<WaypointSource, string>> = {
  [WaypointSource.Steps]: 'Step goal',
  [WaypointSource.Meals]: 'All meals logged',
  [WaypointSource.Water]: 'Water goal',
  [WaypointSource.Movement]: 'Movement',
  [WaypointSource.Mood]: 'Check-in',
  [WaypointSource.Medication]: 'Medication',
  [WaypointSource.Weight]: 'Weigh-in',
  [WaypointSource.Rest]: 'Rest day',
  [WaypointSource.Streak]: 'Streak bonus',
};

const MEALS: { source: WaypointSource; name: string }[] = [
  { source: WaypointSource.Breakfast, name: 'breakfast' },
  { source: WaypointSource.Lunch, name: 'lunch' },
  { source: WaypointSource.Dinner, name: 'dinner' },
];

/** "breakfast", "breakfast and lunch", "breakfast, lunch and dinner" — capitalised. */
function listOf(names: string[]): string {
  const text =
    names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * What `day` earned, as lines to read: the goal day first, the meals logged that day on one
 * line, then the rest in a steady order. Empty when nothing was earned.
 */
export function earnedOn(events: LedgerEvent[], day: string): { lines: EarnedLine[]; total: number } {
  const todays = events.filter((e) => e.day === day);
  const pointsOf = (source: WaypointSource) =>
    todays.filter((e) => e.source === source).reduce((sum, e) => sum + e.points, 0);
  const has = (source: WaypointSource) => todays.some((e) => e.source === source);

  const lines: EarnedLine[] = [];
  if (has(WaypointSource.Steps)) lines.push({ label: LABELS[WaypointSource.Steps]!, points: pointsOf(WaypointSource.Steps) });
  const meals = MEALS.filter((m) => has(m.source));
  if (meals.length) {
    lines.push({
      label: listOf(meals.map((m) => m.name)),
      points: meals.reduce((sum, m) => sum + pointsOf(m.source), 0),
    });
  }
  for (const source of [
    WaypointSource.Meals,
    WaypointSource.Water,
    WaypointSource.Movement,
    WaypointSource.Mood,
    WaypointSource.Medication,
    WaypointSource.Weight,
    WaypointSource.Rest,
    WaypointSource.Streak,
  ]) {
    if (has(source)) lines.push({ label: LABELS[source]!, points: pointsOf(source) });
  }
  return { lines, total: todays.reduce((sum, e) => sum + e.points, 0) };
}

/** Which optional features are on, so "still open" only suggests what can actually be done. */
export type Tracking = { mood: boolean; water: boolean; movement: boolean };

/**
 * Up to `max` things still open today and what each pays, gently: the next meal to log, the
 * check-in, the water goal, the goal day, movement. Never a weigh-in or a rest day — Tern
 * doesn't nudge anyone onto the scale or into resting — and never medication.
 */
export function stillOpen(
  events: LedgerEvent[],
  day: string,
  tracking: Tracking,
  max = 2,
): EarnedLine[] {
  const done = new Set(events.filter((e) => e.day === day).map((e) => e.source));
  const open: EarnedLine[] = [];
  const meal = MEALS.find((m) => !done.has(m.source));
  if (meal) open.push({ label: `Log ${meal.name}`, points: pointsFor(meal.source) });
  if (tracking.mood && !done.has(WaypointSource.Mood)) {
    open.push({ label: 'Check in', points: pointsFor(WaypointSource.Mood) });
  }
  if (tracking.water && !done.has(WaypointSource.Water)) {
    open.push({ label: 'Water goal', points: pointsFor(WaypointSource.Water) });
  }
  if (!done.has(WaypointSource.Steps)) open.push({ label: 'Step goal', points: pointsFor(WaypointSource.Steps) });
  if (tracking.movement && !done.has(WaypointSource.Movement)) {
    open.push({ label: 'Log movement', points: pointsFor(WaypointSource.Movement) });
  }
  return open.slice(0, max);
}

/** The stretch of the route the bird is on: the stop behind it, and the next one ahead. */
export type Leg = {
  /** The stop just passed ("Greenland" at the start of a migration). */
  fromName: string;
  /** The running total at that stop (where the bar starts). */
  from: number;
  next: Milestone;
};

/** The leg `total` is on. */
export function legFor(total: number, events: LedgerEvent[]): Leg {
  const stops = milestonesFor(total, events);
  const next = stops[stops.length - 1];
  const prev = stops.length > 1 ? stops[stops.length - 2] : null;
  const lapStart = (next.lap - 1) * Milestones.MIGRATION_LENGTH;
  // At a migration's first stop, the leg starts at the colony.
  const fromSameLap = prev && prev.waypoints > lapStart ? prev : null;
  return {
    fromName: fromSameLap ? fromSameLap.name : 'Greenland',
    from: fromSameLap ? fromSameLap.waypoints : lapStart,
    next,
  };
}

/** How far through a leg `total` is, 0 to 1. */
export function legProgress(leg: Leg, total: number): number {
  const span = leg.next.waypoints - leg.from;
  return span > 0 ? Math.min(Math.max((total - leg.from) / span, 0), 1) : 0;
}

/** Where a stop sits along one migration, 0 (the colony) to 1 (home again). */
export function routeFraction(stopTotal: number): number {
  const within = stopTotal % Milestones.MIGRATION_LENGTH;
  // The last stop of a migration is the whole way round, not back to the start.
  return within === 0 && stopTotal > 0 ? 1 : within / Milestones.MIGRATION_LENGTH;
}
