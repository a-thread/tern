/** Seed data for the local (no-backend) mode. */
import type { WeightEntry } from './models';

// Oldest to newest: a gentle downward drift with normal day-to-day noise.
const KG = [
  80.6, 80.9, 80.2, 80.1, 79.6, 79.9, 79.3, 79.0, 79.4, 78.7, 78.6, 78.9, 78.4,
  78.2,
];

/** Newest-first entries, one per day ending today, built relative to `now`. */
export function seedWeightEntries(now: Date = new Date()): WeightEntry[] {
  return KG.map((kg, i) => {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (KG.length - 1 - i),
      7,
      2,
    );
    return { id: `w${i + 1}`, kg, loggedAt: d.toISOString() };
  }).reverse();
}
