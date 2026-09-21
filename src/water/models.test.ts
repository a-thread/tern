import {
  MAX_DRINK_OZ,
  averageDaily,
  bucketWater,
  clampWaterGoal,
  dayTotal,
  isValidDrink,
  lastDrink,
  totalsByDay,
  waterProgress,
  type WaterEntry,
} from './models';

const drink = (id: string, oz: number, loggedOn: string, at = '08:00'): WaterEntry => ({
  id,
  oz,
  loggedOn,
  loggedAt: `${loggedOn}T${at}:00.000Z`,
});

describe('isValidDrink', () => {
  it('accepts a sip up to the database limit, fractions included', () => {
    expect(isValidDrink(0.1)).toBe(true);
    expect(isValidDrink(8.45)).toBe(true);
    expect(isValidDrink(MAX_DRINK_OZ)).toBe(true);
  });

  it('rejects nothing, negatives, too much and junk', () => {
    for (const bad of [0, 0.05, -5, MAX_DRINK_OZ + 1, NaN, Infinity]) {
      expect(isValidDrink(bad)).toBe(false);
    }
  });
});

describe('totals', () => {
  const entries = [drink('a', 8, '2026-09-20'), drink('b', 16.5, '2026-09-20'), drink('c', 10, '2026-09-19')];

  it('adds up a day', () => {
    expect(dayTotal(entries, '2026-09-20')).toBe(24.5);
    expect(dayTotal(entries, '2026-09-18')).toBe(0);
  });

  it('keeps hundredths exact, so sums do not drift', () => {
    const many = Array.from({ length: 3 }, (_, i) => drink(String(i), 8.45, '2026-09-20'));
    expect(dayTotal(many, '2026-09-20')).toBe(25.35);
  });

  it('groups by day', () => {
    expect(totalsByDay(entries)).toEqual({ '2026-09-20': 24.5, '2026-09-19': 10 });
  });

  it('finds the latest drink of a day', () => {
    const list = [drink('a', 8, '2026-09-20', '08:00'), drink('b', 16, '2026-09-20', '13:00'), drink('c', 1, '2026-09-19')];
    expect(lastDrink(list, '2026-09-20')?.id).toBe('b');
    expect(lastDrink(list, '2026-09-01')).toBeUndefined();
  });
});

describe('goal helpers', () => {
  it('progress is capped at 1 and safe with no goal', () => {
    expect(waterProgress(16, 64)).toBe(0.25);
    expect(waterProgress(100, 64)).toBe(1);
    expect(waterProgress(16, 0)).toBe(0);
  });

  it('keeps a goal within sensible bounds', () => {
    expect(clampWaterGoal(3)).toBe(16);
    expect(clampWaterGoal(9999)).toBe(200);
    expect(clampWaterGoal(64.004)).toBe(64);
  });
});

describe('bucketWater / averageDaily', () => {
  // 2026-09-20 is a Sunday.
  const today = '2026-09-20';
  const byDay = { '2026-09-20': 70, '2026-09-19': 26, '2026-09-14': 64 };

  it('week: seven daily bars with weekday letters, goal-coloured', () => {
    const bars = bucketWater(byDay, 64, 'Week', today);
    expect(bars.map((b) => b.label).join('')).toBe('MTWTFSS');
    expect(bars[6]).toMatchObject({ value: 70, state: 'goal' });
    expect(bars[5]).toMatchObject({ value: 26, state: 'partial' });
    expect(bars[0]).toMatchObject({ value: 64, state: 'goal' });
    expect(bars[1]).toMatchObject({ value: 0, state: 'none' });
  });

  it('month: thirty unlabelled bars', () => {
    const bars = bucketWater(byDay, 64, 'Month', today);
    expect(bars).toHaveLength(30);
    expect(bars.every((b) => b.label === '')).toBe(true);
  });

  it('6 months: weekly averages, a month initial where a month starts', () => {
    const bars = bucketWater(byDay, 64, '6 months', today);
    expect(bars).toHaveLength(25);
    expect(bars.filter((b) => b.label).length).toBeGreaterThanOrEqual(5);
  });

  it('averages only the days that have something logged', () => {
    expect(averageDaily(byDay, today, 7)).toBe(53.33);
    expect(averageDaily({}, today, 7)).toBeNull();
    expect(averageDaily(byDay, today, 1)).toBe(70);
  });
});
