import { addDays, weekStartKey } from '@shared/utils/date';

/**
 * The days the Food tab's arrows can reach: back to Monday, like the week strip on Today, but
 * always as far as yesterday (which can still be filled in, even on a Monday), and never past today.
 */
export function dayRange(day: string, today: string) {
  const yesterday = addDays(today, -1);
  const weekStart = weekStartKey(today);
  const earliest = weekStart < yesterday ? weekStart : yesterday;
  const prev = addDays(day, -1);
  const next = addDays(day, 1);
  return {
    prev: prev >= earliest ? prev : null,
    next: next <= today ? next : null,
  };
}
