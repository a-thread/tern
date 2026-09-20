import { longestProtectedRun, summarizeSteps } from './models';
import type { DayRecord, DayState } from '@today/models';

describe('longestProtectedRun', () => {
  it('returns 0 for an empty array', () => {
    expect(longestProtectedRun([])).toBe(0);
  });

  it('counts a run of goal days', () => {
    const days: DayState[] = ['goal', 'goal', 'goal'];
    expect(longestProtectedRun(days)).toBe(3);
  });

  it('treats rest days as protecting the streak, not breaking it', () => {
    const days: DayState[] = ['goal', 'rest', 'goal', 'goal'];
    expect(longestProtectedRun(days)).toBe(4);
  });

  it('breaks the streak on a partial or missed day', () => {
    const days: DayState[] = [
      'goal',
      'goal',
      'partial',
      'goal',
      'goal',
      'goal',
    ];
    expect(longestProtectedRun(days)).toBe(3);
  });

  it('resets on none (missed) days', () => {
    const days: DayState[] = ['goal', 'goal', 'none', 'goal'];
    expect(longestProtectedRun(days)).toBe(2);
  });
});

describe('summarizeSteps', () => {
  const rec = (i: number, steps: number): DayRecord => ({
    day: `d${i}`,
    steps,
    goal: 8000,
    state: 'partial',
    chosenRest: false,
    isToday: false,
    future: false,
  });
  const series = (values: number[]) => values.map((v, i) => rec(i, v));

  it('averages only days that have step data', () => {
    expect(summarizeSteps(series([0, 6000, 8000]), 3).average).toBe(7000);
  });

  it('is null without any data', () => {
    expect(summarizeSteps(series([0, 0, 0]), 3)).toEqual({ average: null, changePct: null });
  });

  it('compares with the period before, when there is one', () => {
    const s = summarizeSteps(series([5000, 5000, 6000, 6000]), 2);
    expect(s).toEqual({ average: 6000, changePct: 20 });
  });

  it('has no comparison when the earlier period is short or empty', () => {
    expect(summarizeSteps(series([6000, 6000, 6000]), 2).changePct).toBeNull();
    expect(summarizeSteps(series([0, 0, 6000, 6000]), 2).changePct).toBeNull();
  });
});
