import { formatDayRange, formatShortDate } from '@shared/utils/date';

/** The days a weekly bar covers, first to last. */
export type DaySpan = { from: string; to: string };

/** What a chart bar stands for: a day, or a week (six months is drawn in weeks). */
export type BarDays = { day?: string; week?: DaySpan };

/** The date a bar stands for, as Trends writes it ("Aug 2", or "Aug 2 – 8" for a week); null when it has none. */
export function barDate(bar: BarDays): string | null {
  if (bar.day) return formatShortDate(bar.day);
  if (bar.week) return formatDayRange(bar.week.from, bar.week.to);
  return null;
}
