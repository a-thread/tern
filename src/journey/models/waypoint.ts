/** Which waypoint rule an award came from (matches `waypointRules` ids). */
export enum WaypointSource {
  Steps = 'steps',
  Meals = 'meals',
  Rest = 'rest',
  Water = 'water',
  Mood = 'mood',
}

/** One award in the ledger. */
export type LedgerEvent = { source: WaypointSource; day: string; points: number };

/** Distinct days that earned at least one waypoint. */
export function daysWithWaypoints(events: LedgerEvent[]): number {
  return new Set(events.map((e) => e.day)).size;
}

/** What earns waypoints. */
export class WaypointRules {
  /** Waypoints are earned for behavior only — never for weight or calorie totals. */
  static readonly ALL: { id: WaypointSource; label: string; points: number }[] = [
    { id: WaypointSource.Steps, label: 'Reaching your step goal', points: 40 },
    { id: WaypointSource.Meals, label: 'Logging all meals', points: 15 },
    { id: WaypointSource.Rest, label: 'Taking a rest day', points: 10 },
    { id: WaypointSource.Water, label: 'Reaching your water goal', points: 10 },
    { id: WaypointSource.Mood, label: 'Checking in on mood and stress', points: 10 },
  ];
}


/** What a rule pays out; 0 for a source that has no rule. */
export const pointsFor = (source: WaypointSource): number =>
  WaypointRules.ALL.find((r) => r.id === source)?.points ?? 0;