import { addDays } from '@shared/utils/date';
import {
  byWeekday,
  calendarRows,
  gridLayout,
  GridLayout,
  WEEKDAY_LETTERS,
  weekRows,
} from './weekRows';

/** `n` consecutive days from `from`. */
const run = (from: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({ day: addDays(from, i) }));

describe('weekRows', () => {
  it('starts each row on a Monday, leaving the days before the range empty', () => {
    // 2026-11-04 is a Wednesday.
    const rows = weekRows(run('2026-11-04', 5));
    expect(rows).toEqual([[null, null, 0, 1, 2, 3, 4]]);
  });

  it('ends on the Sunday after the last day, leaving the rest empty', () => {
    // Monday Nov 2 to Tuesday Nov 10.
    const rows = weekRows(run('2026-11-02', 9));
    expect(rows).toEqual([
      [0, 1, 2, 3, 4, 5, 6],
      [7, 8, null, null, null, null, null],
    ]);
  });

  it('sets out 30 days ending Saturday Nov 7 in five weeks', () => {
    const rows = weekRows(run('2026-10-09', 30));
    expect(rows).toHaveLength(5);
    expect(rows[0].slice(0, 4)).toEqual([null, null, null, null]); // Oct 9 is a Friday
    expect(rows[4][5]).toBe(29); // Saturday Nov 7, the last day
    expect(rows[4][6]).toBeNull();
  });

  it('is empty for no days', () => {
    expect(weekRows([])).toEqual([]);
  });
});

describe('gridLayout', () => {
  it('is a calendar for a week or a month, and a strip for six months', () => {
    expect(gridLayout(2)).toBe(GridLayout.Calendar);
    expect(gridLayout(6)).toBe(GridLayout.Calendar);
    expect(gridLayout(27)).toBe(GridLayout.Strip);
  });
});

describe('byWeekday', () => {
  it('turns the weeks into a row per weekday', () => {
    const rows = byWeekday(weekRows(run('2026-11-02', 9)));
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual([0, 7]); // Mondays
    expect(rows[6]).toEqual([6, null]); // Sundays
  });
});

describe('calendarRows', () => {
  it('lays seven days up to today out as one row in day order, headed by their own letters', () => {
    // Sunday Nov 1 to Saturday Nov 7: a Monday-first calendar would put Sunday on a row alone.
    expect(calendarRows(run('2026-11-01', 7))).toEqual({
      letters: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      rows: [[0, 1, 2, 3, 4, 5, 6]],
    });
  });

  it('keeps seven columns when there are fewer days', () => {
    expect(calendarRows(run('2026-11-05', 3))).toEqual({
      letters: ['T', 'F', 'S', '', '', '', ''],
      rows: [[0, 1, 2, null, null, null, null]],
    });
  });

  it('sets out a month in weeks from Monday', () => {
    const { letters, rows } = calendarRows(run('2026-10-09', 30));
    expect(letters).toEqual(WEEKDAY_LETTERS);
    expect(rows).toEqual(weekRows(run('2026-10-09', 30)));
  });
});
