import type { FoodEntry } from '@food/models';
import type { WeightEntry } from '@weight/models';
import {
  buildDays,
  computeStreak,
  leftToDo,
  mealForTime,
  restDaysLeft,
  weekOf,
  type BuildDaysInput,
} from './models';

const food = (meal: FoodEntry['meal']): FoodEntry => ({
  id: meal,
  name: meal,
  meal,
  servings: 1,
  servingLabel: '1 serving',
  calories: 100,
  protein: 1,
  carbs: 1,
  fat: 1,
  tier: 1,
});

const now = new Date(2026, 8, 18, 12, 0);
const weighedToday: WeightEntry = {
  id: 'w',
  lb: 170,
  loggedAt: new Date(2026, 8, 18, 7, 0).toISOString(),
};
const weighedYesterday: WeightEntry = {
  ...weighedToday,
  loggedAt: new Date(2026, 8, 17, 7, 0).toISOString(),
};

describe('mealForTime', () => {
  it('follows the day', () => {
    expect(mealForTime(new Date(2026, 8, 18, 8))).toBe('breakfast');
    expect(mealForTime(new Date(2026, 8, 18, 12))).toBe('lunch');
    expect(mealForTime(new Date(2026, 8, 18, 19))).toBe('dinner');
  });
});

describe('leftToDo', () => {
  it('asks for a generic meal when nothing is logged', () => {
    const [meal] = leftToDo([], undefined, now);
    expect(meal).toMatchObject({
      kind: 'meal',
      meal: 'lunch',
      title: 'Log a meal',
      sub: 'No meals logged yet',
    });
  });

  it('names the next missing meal once some are logged', () => {
    const [meal] = leftToDo([food('breakfast'), food('lunch')], weighedToday, now);
    expect(meal).toMatchObject({
      meal: 'dinner',
      title: 'Log dinner',
      sub: '2 of 3 meals logged',
    });
  });

  it('drops the meal row when every meal is logged', () => {
    const log = [food('breakfast'), food('lunch'), food('dinner')];
    expect(leftToDo(log, undefined, now)).toEqual([{ kind: 'weight' }]);
  });

  it('drops the weight row once weighed today, but not for an old weigh-in', () => {
    expect(leftToDo([], weighedToday, now).map((i) => i.kind)).toEqual(['meal']);
    expect(leftToDo([], weighedYesterday, now).map((i) => i.kind)).toEqual([
      'meal',
      'weight',
    ]);
  });

  it('is empty when everything is done', () => {
    const log = [food('breakfast'), food('lunch'), food('dinner')];
    expect(leftToDo(log, weighedToday, now)).toEqual([]);
  });
});

// 2026-09-20 is a Sunday; the week is Mon 09-14 .. Sun 09-20.
const TODAY = '2026-09-20';
const days = (over: Partial<BuildDaysInput> = {}) =>
  buildDays({
    stepsByDay: {},
    restDays: new Set(),
    goal: 8000,
    restPerWeek: 2,
    autoDetect: false,
    today: TODAY,
    count: 14,
    ...over,
  });

describe('buildDays', () => {
  it('reads goal, partial and none from the step count', () => {
    const d = days({
      stepsByDay: { '2026-09-19': 9000, '2026-09-18': 4000, '2026-09-17': 0 },
    });
    const by = Object.fromEntries(d.map((x) => [x.day, x.state]));
    expect(by['2026-09-19']).toBe('goal');
    expect(by['2026-09-18']).toBe('partial');
    expect(by['2026-09-17']).toBe('none');
    expect(d[d.length - 1]).toMatchObject({ day: TODAY, isToday: true });
    expect(d).toHaveLength(14);
  });

  it('marks a chosen rest day, but reaching the goal still reads as goal', () => {
    const d = days({
      stepsByDay: { '2026-09-19': 500, '2026-09-18': 9000 },
      restDays: new Set(['2026-09-19', '2026-09-18']),
    });
    const by = Object.fromEntries(d.map((x) => [x.day, x.state]));
    expect(by['2026-09-19']).toBe('rest');
    expect(by['2026-09-18']).toBe('goal');
  });

  it('detects low-step past days as rest only when auto-detect is on, within the allowance', () => {
    const stepsByDay = {
      '2026-09-14': 500,
      '2026-09-15': 400,
      '2026-09-16': 300,
    };
    const off = days({ stepsByDay });
    expect(off.filter((d) => d.state === 'rest')).toHaveLength(0);

    const on = days({ stepsByDay, autoDetect: true });
    const rest = on.filter((d) => d.state === 'rest').map((d) => d.day);
    expect(rest).toEqual(['2026-09-14', '2026-09-15']); // allowance of 2
    expect(on.find((d) => d.day === '2026-09-16')!.state).toBe('partial');
  });

  it('never detects today as a rest day, and lets chosen days claim the allowance first', () => {
    const d = days({
      stepsByDay: { '2026-09-14': 500, '2026-09-15': 400, '2026-09-20': 100 },
      restDays: new Set(['2026-09-19', '2026-09-20']),
      autoDetect: true,
    });
    const by = Object.fromEntries(d.map((x) => [x.day, x.state]));
    expect(by['2026-09-20']).toBe('rest'); // chosen
    expect(by['2026-09-19']).toBe('rest'); // chosen
    expect(by['2026-09-14']).toBe('partial'); // allowance already used
  });
});

describe('computeStreak', () => {
  const streak = (stepsByDay: Record<string, number>, restDays: string[] = []) =>
    computeStreak(days({ stepsByDay, restDays: new Set(restDays) }));

  it('counts consecutive goal days back from yesterday when today is still in progress', () => {
    expect(
      streak({ '2026-09-19': 9000, '2026-09-18': 9000, '2026-09-17': 100 }),
    ).toBe(2);
  });

  it('adds today once it reaches the goal', () => {
    expect(streak({ '2026-09-20': 9000, '2026-09-19': 9000 })).toBe(2);
  });

  it('holds through a rest day without counting it', () => {
    expect(
      streak(
        { '2026-09-19': 9000, '2026-09-18': 300, '2026-09-17': 9000 },
        ['2026-09-18'],
      ),
    ).toBe(2);
  });

  it('breaks on a missed day', () => {
    expect(streak({ '2026-09-19': 9000, '2026-09-18': 5000, '2026-09-17': 9000 })).toBe(1);
  });

  it('is zero with no data', () => {
    expect(streak({})).toBe(0);
  });
});

describe('weekOf / restDaysLeft', () => {
  it('returns Monday to Sunday, with later days as future placeholders', () => {
    const d = days({});
    const wk = weekOf(d.slice(0, -2), '2026-09-18'); // pretend today is Friday
    expect(wk.map((x) => x.day)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]);
    expect(wk[5].future).toBe(true);
    expect(wk[6].future).toBe(true);
    expect(wk[0].future).toBe(false);
  });

  it('counts the allowance left this week', () => {
    const d = days({ stepsByDay: { '2026-09-19': 100 }, restDays: new Set(['2026-09-19']) });
    expect(restDaysLeft(d, TODAY, 2)).toBe(1);
    expect(restDaysLeft(d, TODAY, 1)).toBe(0);
    expect(restDaysLeft(d, TODAY, 0)).toBe(0);
  });
});
