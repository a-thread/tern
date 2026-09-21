import type { FoodEntry } from '@food/models';
import type { WeightEntry } from '@weight/models';
import {
  buildDays,
  computeStreak,
  goalFor,
  recordGoalChange,
  suggestGoal,
  type DayRecord,
  greetingFor,
  leftToDo,
  mealForTime,
  todaySummary,
  weighInDue,
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
    goalFor: () => 8000,
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

describe('greetingFor', () => {
  const at = (h: number) => greetingFor(new Date(2026, 8, 18, h));

  it('follows the time of day', () => {
    expect(at(6)).toBe('Morning');
    expect(at(11)).toBe('Morning');
    expect(at(12)).toBe('Afternoon');
    expect(at(16)).toBe('Afternoon');
    expect(at(17)).toBe('Evening');
    expect(at(23)).toBe('Evening');
  });

  it('is a neutral hello in the small hours', () => {
    expect(at(0)).toBe('Hello');
    expect(at(4)).toBe('Hello');
  });
});

describe('goal history', () => {
  it('uses the current goal when nothing has changed', () => {
    expect(goalFor([], 8000, '2026-09-01')).toBe(8000);
  });

  it('applies a change from its day onward, leaving earlier days alone', () => {
    const h = recordGoalChange([], 8000, 10000, '2026-09-10');
    expect(goalFor(h, 10000, '2026-09-09')).toBe(8000);
    expect(goalFor(h, 10000, '2026-09-10')).toBe(10000);
    expect(goalFor(h, 10000, '2026-10-01')).toBe(10000);
    expect(goalFor(h, 10000, '2020-01-01')).toBe(8000);
  });

  it('collapses same-day changes, and drops one that returns to the old goal', () => {
    let h = recordGoalChange([], 8000, 8500, '2026-09-10');
    h = recordGoalChange(h, 8500, 9000, '2026-09-10');
    expect(h.filter((c) => c.from === '2026-09-10')).toEqual([
      { from: '2026-09-10', goal: 9000 },
    ]);
    h = recordGoalChange(h, 9000, 8000, '2026-09-10');
    expect(h).toHaveLength(1);
    expect(goalFor(h, 8000, '2026-09-10')).toBe(8000);
  });

  it('keeps a streak intact when the goal is raised later', () => {
    const history = recordGoalChange([], 8000, 12000, '2026-09-20');
    const d = buildDays({
      stepsByDay: { '2026-09-19': 9000, '2026-09-18': 9000 },
      restDays: new Set(),
      goalFor: (day) => goalFor(history, 12000, day),
      restPerWeek: 2,
      autoDetect: false,
      today: '2026-09-20',
      count: 5,
    });
    expect(computeStreak(d)).toBe(2);
  });
});

describe('suggestGoal', () => {
  const series = (steps: number[], goal = 8000): DayRecord[] =>
    steps.map((s, i) => ({
      day: `2026-08-${String(i + 1).padStart(2, '0')}`,
      steps: s,
      goal,
      state: s >= goal ? 'goal' : 'partial',
      chosenRest: false,
      isToday: false,
      future: false,
    }));

  it('offers nothing without enough data', () => {
    expect(suggestGoal(series(Array(10).fill(9000)), 8000)).toBeNull();
  });

  it('suggests a little more when the goal is met almost every day', () => {
    expect(suggestGoal(series(Array(20).fill(9000)), 8000)).toBe(9000);
  });

  it('suggests something more reachable when it is rarely met', () => {
    expect(suggestGoal(series(Array(20).fill(4000)), 8000)).toBe(4000);
  });

  it('stays quiet when the goal fits', () => {
    const steps = Array.from({ length: 20 }, (_, i) => (i % 2 ? 9000 : 6000));
    expect(suggestGoal(series(steps), 8000)).toBeNull();
  });
});

describe('weighInDue', () => {
  // `now` is Friday 2026-09-18, which is weekday 6 (1 = Sunday).
  const daily = { frequency: 'daily', weekday: 1 } as const;
  const weekly = (weekday: number) => ({ frequency: 'weekly', weekday }) as const;
  const daysAgo = (n: number): WeightEntry => ({
    ...weighedToday,
    loggedAt: new Date(2026, 8, 18 - n, 7, 0).toISOString(),
  });

  it('is never due once weighed today', () => {
    expect(weighInDue(weighedToday, now, daily)).toBe(false);
    expect(weighInDue(weighedToday, now, weekly(6))).toBe(false);
  });

  it('daily is due every day it has not been done', () => {
    expect(weighInDue(weighedYesterday, now, daily)).toBe(true);
    expect(weighInDue(undefined, now, daily)).toBe(true);
  });

  it('weekly is due on the chosen weekday', () => {
    expect(weighInDue(daysAgo(2), now, weekly(6))).toBe(true);
  });

  it('weekly stays quiet on other days while the last weigh-in is recent', () => {
    expect(weighInDue(daysAgo(1), now, weekly(2))).toBe(false);
    expect(weighInDue(daysAgo(6), now, weekly(2))).toBe(false);
  });

  it('weekly becomes due anyway once a week has passed, and for a first weigh-in', () => {
    expect(weighInDue(daysAgo(7), now, weekly(2))).toBe(true);
    expect(weighInDue(daysAgo(20), now, weekly(2))).toBe(true);
    expect(weighInDue(undefined, now, weekly(2))).toBe(true);
  });
});

describe('leftToDo with weigh-in frequency and medication', () => {
  const log = [food('breakfast'), food('lunch'), food('dinner')];
  const meds = [
    { id: 'a', name: 'Vitamin D', at: 480 },
    { id: 'b', name: 'Iron', at: 1200 },
  ];

  it('weekly weigh-ins leave Today quiet on an ordinary day', () => {
    const items = leftToDo(log, weighedYesterday, now, { weighIn: { frequency: 'weekly', weekday: 2 } });
    expect(items).toEqual([]);
  });

  it('adds a row for each medication not yet taken, after the other rows', () => {
    const items = leftToDo([], weighedToday, now, { medications: meds });
    expect(items.map((i) => i.kind)).toEqual(['meal', 'medication', 'medication']);
    expect(items[1]).toEqual({ kind: 'medication', medicationId: 'a', name: 'Vitamin D', at: 480 });
  });

  it('is empty when everything, medication included, is done', () => {
    expect(leftToDo(log, weighedToday, now, { medications: [] })).toEqual([]);
  });
});

describe('todaySummary', () => {
  it('lists the meals in day order with their calories', () => {
    const log = [
      { ...food('dinner'), calories: 600, servings: 1 },
      { ...food('breakfast'), calories: 200, servings: 1.5 },
    ];
    const summary = todaySummary(log, weighedToday, [], false, now);
    expect(summary.meals).toEqual({ names: ['breakfast', 'dinner'], calories: 900 });
  });

  it('has no meals when nothing is logged', () => {
    expect(todaySummary([], undefined, [], false, now).meals).toBeNull();
  });

  it('only counts a weigh-in from today', () => {
    expect(todaySummary([], weighedToday, [], false, now).weighedIn).toBe(weighedToday);
    expect(todaySummary([], weighedYesterday, [], false, now).weighedIn).toBeNull();
    expect(todaySummary([], undefined, [], false, now).weighedIn).toBeNull();
  });

  it('carries the medications taken and whether the step goal was reached', () => {
    const summary = todaySummary([], undefined, ['Vitamin D'], true, now);
    expect(summary.medications).toEqual(['Vitamin D']);
    expect(summary.stepGoalReached).toBe(true);
  });
});
