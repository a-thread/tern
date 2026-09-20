import {
  computeTrend,
  formatLoggedAt,
  isLoggedToday,
  type WeightEntry,
} from './models';

const entry = (lb: number, loggedAt = '2026-09-01T07:00:00'): WeightEntry => ({
  id: String(lb),
  lb,
  loggedAt,
});

describe('computeTrend', () => {
  it('is empty with no entries', () => {
    expect(computeTrend([])).toEqual([]);
  });

  it('starts at the first reading and smooths toward later ones', () => {
    // newest first: readings were 80, then 82
    const trend = computeTrend([entry(82), entry(80)]);
    expect(trend[0]).toBe(80);
    expect(trend[1]).toBeGreaterThan(80);
    expect(trend[1]).toBeLessThan(82);
  });

  it('barely moves for one outlier day', () => {
    const steady = Array.from({ length: 10 }, () => entry(78));
    const withSpike = computeTrend([entry(80), ...steady]);
    expect(withSpike[withSpike.length - 1]).toBeLessThan(78.7);
  });
});

describe('formatLoggedAt', () => {
  const now = new Date(2026, 8, 18, 12, 0);

  it('labels today and yesterday', () => {
    expect(formatLoggedAt(new Date(2026, 8, 18, 7, 2).toISOString(), now)).toBe('Today, 7:02 am');
    expect(formatLoggedAt(new Date(2026, 8, 17, 19, 5).toISOString(), now)).toBe('Yesterday, 7:05 pm');
  });

  it('uses the weekday within the last week, and the date beyond it', () => {
    expect(formatLoggedAt(new Date(2026, 8, 15, 6, 58).toISOString(), now)).toBe('Tue, 6:58 am');
    expect(formatLoggedAt(new Date(2026, 7, 3, 12, 0).toISOString(), now)).toBe('Aug 3, 12:00 pm');
  });
});

describe('isLoggedToday', () => {
  const now = new Date(2026, 8, 18, 12, 0);

  it('is true for any time on the same local day', () => {
    expect(isLoggedToday(new Date(2026, 8, 18, 0, 5).toISOString(), now)).toBe(true);
    expect(isLoggedToday(new Date(2026, 8, 18, 23, 55).toISOString(), now)).toBe(true);
  });

  it('is false for other days', () => {
    expect(isLoggedToday(new Date(2026, 8, 17, 23, 55).toISOString(), now)).toBe(false);
    expect(isLoggedToday(new Date(2026, 8, 19, 0, 5).toISOString(), now)).toBe(false);
  });
});
