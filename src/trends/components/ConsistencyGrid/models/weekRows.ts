import { addDays, weekdayLetter, weekStartKey } from '@shared/utils/date';

/** A week, Monday to Sunday: each slot is the index of that day in the list, or null if not in it. */
export type WeekRow = (number | null)[];

/** How the grid is laid out. */
export enum GridLayout {
  /** A row per week, a column per weekday: a small calendar. */
  Calendar = 'calendar',
  /** A column per week, a row per weekday: for a range too long to stack as rows. */
  Strip = 'strip',
}

export class GridLimits {
  /** More weeks than this (six months is 26) and the grid turns on its side. */
  static readonly CALENDAR_MAX_WEEKS = 6;
}

/**
 * The days, consecutive and oldest first, set out in weeks from Monday to Sunday. The first
 * week starts on the Monday before the first day and the last ends on the Sunday after the
 * last, with null for the days outside the list.
 */
export function weekRows(days: readonly { day: string }[]): WeekRow[] {
  if (days.length === 0) return [];
  const index = new Map(days.map((d, i) => [d.day, i]));
  const last = days[days.length - 1].day;
  const rows: WeekRow[] = [];
  for (
    let monday = weekStartKey(days[0].day);
    monday <= last;
    monday = addDays(monday, 7)
  ) {
    rows.push(
      Array.from(
        { length: 7 },
        (_, i) => index.get(addDays(monday, i)) ?? null,
      ),
    );
  }
  return rows;
}

/** Rows turned into columns: a row per weekday, a slot per week. */
export const byWeekday = (rows: readonly WeekRow[]): WeekRow[] =>
  Array.from({ length: 7 }, (_, wd) => rows.map((r) => r[wd]));

export class GridLabels {
  /** Monday first, as Today's week strip. */
  static readonly WEEKDAY_LETTERS: readonly string[] = [
    'M',
    'T',
    'W',
    'T',
    'F',
    'S',
    'S',
  ];
}

/**
 * The grid's shape for `days`, decided in one place. `letters` head the calendar's columns, or
 * label the strip's rows; each of `rows` is a row of day indexes (null where there's no day).
 */
export type GridShape = {
  layout: GridLayout;
  letters: readonly string[];
  rows: WeekRow[];
};

/**
 * How the grid sets out `days` (consecutive, oldest first):
 * - a week or less: one calendar row in the order the days came, headed by their own weekday
 *   letters, as the bar chart above lays them out (seven days up to today would otherwise split
 *   across two Monday-to-Sunday rows, a lone Sunday above the rest); fewer than seven keep the
 *   same seven columns, empty at the end;
 * - up to `GridLimits.CALENDAR_MAX_WEEKS` weeks: a calendar, a row per week from Monday;
 * - longer (six months): a strip on its side, a row per weekday and a column per week.
 */
export function gridShape(days: readonly { day: string }[]): GridShape {
  if (days.length <= 7) {
    const pad = 7 - days.length;
    return {
      layout: GridLayout.Calendar,
      letters: [
        ...days.map((d) => weekdayLetter(d.day)),
        ...Array(pad).fill(''),
      ],
      rows: days.length
        ? [[...days.map((_, i) => i), ...Array<null>(pad).fill(null)]]
        : [],
    };
  }
  const weeks = weekRows(days);
  return weeks.length > GridLimits.CALENDAR_MAX_WEEKS
    ? {
        layout: GridLayout.Strip,
        letters: GridLabels.WEEKDAY_LETTERS,
        rows: byWeekday(weeks),
      }
    : {
        layout: GridLayout.Calendar,
        letters: GridLabels.WEEKDAY_LETTERS,
        rows: weeks,
      };
}
