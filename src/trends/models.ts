import type { DayState } from '@today/models';

/**
 * Longest run of consecutive days that don't break the streak — 'goal' and
 * 'rest' both count (rest days hold the streak), 'partial'/'none' reset it.
 */
export function longestProtectedRun(days: DayState[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day === 'goal' || day === 'rest') {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}
