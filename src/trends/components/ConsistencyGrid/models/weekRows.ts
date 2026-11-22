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

/** Monday-to-Sunday weeks, null-padded at both ends. */
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

export type GridShape = {
  layout: GridLayout;
  letters: readonly string[];
  rows: WeekRow[];
};

/**
 * A week is one row in day order (Monday rows would strand a lone Sunday); up to
 * `CALENDAR_MAX_WEEKS` a calendar; longer, a strip with a row per weekday.
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
