/** Seed data only — swapping in real Supabase queries means replacing just this file. */
import type { WeightEntry } from './models';

export const weightTrend = [80.6, 80.1, 79.8, 79.4, 79.0, 78.7, 78.4];

export const weightEntries: WeightEntry[] = [
  { id: 'w1', kg: 78.2, loggedAt: 'Today, 7:02 am' },
  { id: 'w2', kg: 78.9, loggedAt: 'Yesterday, 7:14 am' },
  { id: 'w3', kg: 78.4, loggedAt: 'Thu, 6:58 am' },
];
