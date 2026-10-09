/** Which waypoint rule an award came from (matches `waypointRules` ids). */
export enum WaypointSource {
  Steps = 'steps',
  Meals = 'meals',
  Rest = 'rest',
  Water = 'water',
  Mood = 'mood',
  Weight = 'weight',
  Medication = 'medication',
  // One each, for logging that meal: the "all meals" award above is the bonus on top.
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  /** A one-time bonus at a streak milestone; the only source whose points vary (see `StreakBonuses`). */
  Streak = 'streak',
  /** Logging any movement in a day: a walk, a swim, a class. */
  Movement = 'movement',
}

/** One award in the ledger. */
export type LedgerEvent = { source: WaypointSource; day: string; points: number };

/** Distinct days that earned at least one waypoint. */
export function daysWithWaypoints(events: LedgerEvent[]): number {
  return new Set(events.map((e) => e.day)).size;
}

/** What earns waypoints. */
export class WaypointRules {
  /**
   * Waypoints are earned for behavior only — logging, moving, resting, showing
   * up. Never for a number on the scale or a calorie total: the weigh-in
   * award is for logging one, whatever it says. For the streak rule, `points`
   * is the first milestone's bonus; later ones pay more.
   */
  static readonly ALL: { id: WaypointSource; label: string; points: number }[] = [
    { id: WaypointSource.Steps, label: 'A goal day: steps or movement', points: 40 },
    { id: WaypointSource.Meals, label: 'Logging all meals', points: 15 },
    { id: WaypointSource.Breakfast, label: 'Logging breakfast', points: 5 },
    { id: WaypointSource.Lunch, label: 'Logging lunch', points: 5 },
    { id: WaypointSource.Dinner, label: 'Logging dinner', points: 5 },
    { id: WaypointSource.Rest, label: 'Taking a rest day', points: 10 },
    { id: WaypointSource.Water, label: 'Reaching your water goal', points: 10 },
    { id: WaypointSource.Movement, label: 'Logging movement', points: 10 },
    { id: WaypointSource.Mood, label: 'Checking in on mood and stress', points: 10 },
    { id: WaypointSource.Medication, label: 'Taking all your medication', points: 10 },
    { id: WaypointSource.Weight, label: 'Logging a weigh-in', points: 5 },
    { id: WaypointSource.Streak, label: 'Reaching a streak milestone', points: 25 },
  ];

  /** The three meals read as one line in lists: "Logging each meal". */
  static readonly PER_MEAL = [WaypointSource.Breakfast, WaypointSource.Lunch, WaypointSource.Dinner];
}

/** The rules as a list for people to read, with the three meals folded into one line. */
export const listedRules = () =>
  WaypointRules.ALL.filter(
    (r) => r.id !== WaypointSource.Lunch && r.id !== WaypointSource.Dinner,
  ).map((r) => (r.id === WaypointSource.Breakfast ? { ...r, label: 'Logging each meal' } : r));

/** Bonus waypoints for a streak reaching these lengths, in days. */
export class StreakBonuses {
  static readonly MILESTONES: { days: number; points: number }[] = [
    { days: 7, points: 25 },
    { days: 14, points: 40 },
    { days: 30, points: 75 },
    { days: 60, points: 100 },
    { days: 100, points: 150 },
    { days: 200, points: 250 },
    { days: 365, points: 500 },
  ];
}

/** The bonus for a streak of exactly this many days; 0 when it isn't a milestone. */
export const streakBonus = (days: number): number =>
  StreakBonuses.MILESTONES.find((m) => m.days === days)?.points ?? 0;

/** What a rule pays out; 0 for a source that has no rule. */
export const pointsFor = (source: WaypointSource): number =>
  WaypointRules.ALL.find((r) => r.id === source)?.points ?? 0;
