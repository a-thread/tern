/** Seed data only — swapping in real Supabase queries means replacing just this file. */
import type { Milestone } from './models';

export const INITIAL_WAYPOINTS = 1240;

export const milestones: Milestone[] = [
  { id: 'm1', name: 'Cape Cod', waypoints: 250, reachedOn: 'Apr 30' },
  { id: 'm2', name: 'Nova Scotia', waypoints: 600, reachedOn: 'Jun 14' },
  { id: 'm3', name: 'Newfoundland', waypoints: 1000, reachedOn: 'Aug 2' },
  { id: 'm4', name: 'Iceland', waypoints: 1500 },
];
