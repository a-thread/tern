import { addDays, weekStartKey } from '@shared/utils/date';

/**
 * Where the week strip's arrows go from the viewed `day`: the same weekday a week earlier or
 * later. Back stops at the week holding `earliest` (the oldest day of history), and forward
 * lands on today rather than past it; on this week there is no next.
 */
export function weekRange(day: string, today: string, earliest?: string) {
  const back = addDays(day, -7);
  const forward = addDays(day, 7);
  const firstWeek = earliest ? weekStartKey(earliest) : weekStartKey(today);
  return {
    prev: weekStartKey(back) >= firstWeek ? back : null,
    next:
      weekStartKey(day) < weekStartKey(today)
        ? forward < today
          ? forward
          : today
        : null,
  };
}
