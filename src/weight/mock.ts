/** Seed data for the local (no-backend) mode. */
import type { WeightEntry } from './models';

// Oldest to newest: a gentle downward drift with normal day-to-day noise.
const LB = [
  177.7, 178.3, 176.8, 176.6, 175.5, 176.1, 174.8, 174.2, 175.0, 173.5, 173.3,
  174.0, 172.8, 172.4,
];

/** Newest-first entries, one per day ending today, built relative to `now`. */
export function seedWeightEntries(now: Date = new Date()): WeightEntry[] {
  return LB.map((lb, i) => {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (LB.length - 1 - i),
      7,
      2,
    );
    return { id: `w${i + 1}`, lb, loggedAt: d.toISOString() };
  }).reverse();
}
