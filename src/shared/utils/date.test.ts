import {
  addDays,
  dayKey,
  formatLongDate,
  msUntilMidnight,
  parseDayKey,
  weekStartKey,
} from './date';

describe('date helpers', () => {
  it('round-trips a day key', () => {
    expect(dayKey(parseDayKey('2026-09-13'))).toBe('2026-09-13');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('finds the Monday of a week', () => {
    expect(weekStartKey('2026-09-14')).toBe('2026-09-14'); // Monday
    expect(weekStartKey('2026-09-20')).toBe('2026-09-14'); // Sunday
    expect(weekStartKey('2026-09-17')).toBe('2026-09-14'); // Thursday
  });

  it('counts down to local midnight', () => {
    expect(msUntilMidnight(new Date(2026, 8, 18, 23, 59, 0))).toBe(60_000);
    expect(msUntilMidnight(new Date(2026, 8, 18, 0, 0, 0))).toBe(86_400_000);
  });

  it('formats a long date', () => {
    expect(formatLongDate('2026-09-19')).toBe('Saturday, Sep 19');
  });
});
