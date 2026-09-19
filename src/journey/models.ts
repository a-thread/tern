export type Milestone = {
  id: string;
  name: string;
  waypoints: number;
  reachedOn?: string;
};

/** Waypoints are earned for behavior only — never for weight or calorie totals. */
export const waypointRules = [
  { id: 'steps', label: 'Reaching your step goal', points: 40 },
  { id: 'meals', label: 'Logging all meals', points: 15 },
  { id: 'rest', label: 'Taking a rest day', points: 10 },
];
