import { addDays } from '@shared/utils/date';
import { Meal } from './foodEntry';
import {
  AdaptiveTarget,
  Aim,
  completeDays,
  dailyTrend,
  estimateBurn,
  suggestTarget,
  weeklyEnergy,
  worthSuggesting,
} from './energyBalance';

const TODAY = '2026-10-29';
const at = (day: string) => `${day}T12:00:00`;

/** Three meals adding up to `kcal`, logged every day for `days` days before today. */
function eating(kcal: number, days = 30, skip: (i: number) => boolean = () => false) {
  const byDay: Record<string, { meal: Meal; calories: number; servings: number }[]> = {};
  for (let i = 1; i <= days; i++) {
    if (skip(i)) continue;
    byDay[addDays(TODAY, -i)] = [
      { meal: Meal.Breakfast, calories: kcal * 0.3, servings: 1 },
      { meal: Meal.Lunch, calories: kcal * 0.3, servings: 1 },
      { meal: Meal.Dinner, calories: kcal * 0.4, servings: 1 },
    ];
  }
  return byDay;
}

/** A weigh-in every `every` days, losing `lossPerDay` lb a day, ending at `end` yesterday. */
function weighing(end: number, lossPerDay: number, every = 1, days = 45) {
  const out: { lb: number; loggedAt: string }[] = [];
  for (let i = days; i >= 1; i -= every) out.push({ lb: end + lossPerDay * (i - 1), loggedAt: at(addDays(TODAY, -i)) });
  return out;
}

describe('dailyTrend', () => {
  it('fills days between weigh-ins on a straight line and smooths them', () => {
    const trend = dailyTrend(
      [
        { lb: 180, loggedAt: at('2026-10-01') },
        { lb: 170, loggedAt: at('2026-10-11') },
      ],
      '2026-10-01',
      '2026-10-11',
    );
    expect(Object.keys(trend)).toHaveLength(11);
    expect(trend['2026-10-01']).toBe(180);
    expect(trend['2026-10-11']).toBeLessThan(180);
    expect(trend['2026-10-11']).toBeGreaterThan(170);
  });
});

describe('completeDays', () => {
  it('counts days with two meals or every core meal accounted for, never empty days', () => {
    const days = completeDays(
      {
        a: [{ meal: Meal.Breakfast, calories: 300, servings: 1 }, { meal: Meal.Lunch, calories: 500, servings: 1 }],
        b: [{ meal: Meal.Dinner, calories: 700, servings: 1 }],
        c: [{ meal: Meal.Dinner, calories: 700, servings: 1 }],
        d: [],
      },
      { c: [Meal.Breakfast, Meal.Lunch] },
    );
    expect(days).toEqual(['a', 'c']);
  });
});

describe('estimateBurn', () => {
  it('reads burn as intake when weight is steady', () => {
    const r = estimateBurn({ foodByDay: eating(2100), weighs: weighing(170, 0), today: TODAY });
    expect(r.status).toBe('ready');
    if (r.status === 'ready') expect(r.kcal).toBe(2100);
  });

  it('adds what a falling trend says was burned: 1.2 lb over 3 weeks at 2,050 is about 2,250', () => {
    const r = estimateBurn({ foodByDay: eating(2050), weighs: weighing(170, 1.2 / 21), today: TODAY });
    expect(r.status).toBe('ready');
    if (r.status === 'ready') {
      expect(Math.abs(r.kcal - 2250)).toBeLessThan(20);
      expect(r.trendChangeLb).toBeCloseTo(-1.2, 1);
      expect(r.low).toBeLessThan(r.kcal);
      expect(r.high).toBeGreaterThan(r.kcal);
    }
  });

  it('keeps learning without enough logged days', () => {
    const r = estimateBurn({ foodByDay: eating(2000, 30, (i) => i % 2 === 0), weighs: weighing(170, 0), today: TODAY });
    expect(r).toMatchObject({ status: 'learning', loggedDays: 11, neededDays: AdaptiveTarget.MIN_LOGGED_DAYS });
  });

  it('keeps learning without weigh-ins spread across the window', () => {
    const r = estimateBurn({ foodByDay: eating(2000), weighs: weighing(170, 0, 1, 5), today: TODAY });
    expect(r.status).toBe('learning');
  });

  it('leaves unlogged days out instead of counting them as nothing eaten', () => {
    const r = estimateBurn({ foodByDay: eating(2100, 30, (i) => i % 5 === 0), weighs: weighing(170, 0), today: TODAY });
    expect(r.status).toBe('ready');
    if (r.status === 'ready') expect(r.kcal).toBe(2100);
  });
});

describe('suggestTarget', () => {
  it('applies the aim and moves at most 100 a week', () => {
    expect(suggestTarget(2250, Aim.LoseSlowly, 2100, 170)).toBe(2000);
    expect(suggestTarget(2250, Aim.Maintain, 2100, 170)).toBe(2200);
    expect(suggestTarget(2250, Aim.Gain, 2100, 170)).toBe(2200);
    expect(suggestTarget(2250, Aim.Lose, 2400, 170)).toBe(2300);
  });

  it('never aims below the floor or for a faster loss than 1% a week', () => {
    expect(suggestTarget(1500, Aim.Lose, 1250, 120)).toBe(1200);
    // 80 lb × 1% × 3,500 ÷ 7 = 400 a day at most, less than "lose" asks for.
    expect(suggestTarget(1800, Aim.Lose, 1450, 80)).toBe(1400);
  });

  it('only offers a change worth making', () => {
    expect(worthSuggesting(2000, 2100)).toBe(true);
    expect(worthSuggesting(2050, 2100)).toBe(true);
    expect(worthSuggesting(2100, 2100)).toBe(false);
  });
});

describe('weeklyEnergy', () => {
  it('gives intake for every logged week and burn once there is enough history', () => {
    const weeks = weeklyEnergy({
      foodByDay: eating(2050, 60),
      weighs: weighing(170, 1.2 / 21, 1, 70),
      today: TODAY,
      weeks: 6,
    });
    expect(weeks).toHaveLength(6);
    expect(weeks.every((w) => w.intake === 2050)).toBe(true);
    const latest = weeks[weeks.length - 1];
    expect(latest.weekEnd).toBe(addDays(TODAY, -1));
    expect(Math.abs((latest.burn ?? 0) - 2250)).toBeLessThan(20);
  });
});
