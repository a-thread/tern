/**
 * Seed data only. Represents what will eventually come from Health
 * Connect / HealthKit sync (item 6 of the roadmap) — swapping this file
 * for a real health-data hook is the intended migration path.
 */
import type { DayState } from './models';

export const today = {
  date: 'Saturday, Sep 13',
  steps: 6842,
  streak: 12,
  restDaysLeft: 1,
};

export const week: {
  label: string;
  progress: number;
  rest?: boolean;
  today?: boolean;
}[] = [
  { label: 'M', progress: 0.87 },
  { label: 'T', progress: 0.95 },
  { label: 'W', progress: 0.24, rest: true },
  { label: 'T', progress: 0.9 },
  { label: 'F', progress: 0.31 },
  { label: 'S', progress: 0.92 },
  { label: 'S', progress: 0.855, today: true },
];

export const weekBars = [
  { label: 'M', value: 8420, state: 'goal' as DayState },
  { label: 'T', value: 4100, state: 'partial' as DayState },
  { label: 'W', value: 2140, state: 'rest' as DayState },
  { label: 'T', value: 8950, state: 'goal' as DayState },
  { label: 'F', value: 5300, state: 'partial' as DayState },
  { label: 'S', value: 9240, state: 'goal' as DayState },
  { label: 'S', value: 6842, state: 'goal' as DayState },
];

export const monthConsistency: DayState[] = [
  'goal',
  'partial',
  'goal',
  'goal',
  'rest',
  'goal',
  'goal',
  'goal',
  'goal',
  'partial',
  'goal',
  'rest',
  'goal',
  'goal',
  'partial',
  'goal',
  'goal',
  'goal',
  'rest',
  'partial',
  'goal',
  'goal',
  'goal',
  'partial',
  'rest',
  'goal',
  'goal',
  'goal',
  'none',
  'none',
];
