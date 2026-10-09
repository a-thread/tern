import { TrendRange } from '@shared/models/trendRange';
import { DayState } from '@shared/models/dayState';
import { averageMinutes, bucketMinutes } from './movementBars';

const TODAY = '2026-10-08';

describe('movement bars', () => {
  const byDay = { '2026-10-08': 35, '2026-10-07': 10, '2026-10-05': 60 };

  it('makes a bar per day for a week, marking goal days', () => {
    const bars = bucketMinutes(byDay, 30, TrendRange.Week, TODAY);
    expect(bars).toHaveLength(7);
    expect(bars[6]).toMatchObject({ value: 35, state: DayState.Goal });
    expect(bars[5]).toMatchObject({ value: 10, state: DayState.Partial });
    expect(bars[4]).toMatchObject({ value: 0, state: DayState.None });
  });

  it('marks a goal day only from minutes that count toward one', () => {
    const bars = bucketMinutes(byDay, 30, TrendRange.Week, TODAY, { '2026-10-08': 10 });
    expect(bars[6]).toMatchObject({ value: 35, state: DayState.Partial });
  });

  it('averages over every day of the range', () => {
    expect(averageMinutes(byDay, TODAY, 7)).toBe(15);
    expect(averageMinutes({}, TODAY, 7)).toBeNull();
  });
});
