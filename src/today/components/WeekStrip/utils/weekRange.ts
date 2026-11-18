import { addDays, weekStartKey } from '@shared/utils/date';

/** Same weekday ±7, stopping at `earliest`'s week and never past today. */
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
