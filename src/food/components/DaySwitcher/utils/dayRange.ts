import { addDays, weekStartKey } from '@shared/utils/date';

/** Back to Monday, but always as far as yesterday, and never past today. */
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
