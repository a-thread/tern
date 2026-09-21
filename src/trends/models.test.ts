import { RANGE_DAYS, bucketSteps, longestProtectedRun, summarizeSteps, weightTrendFor } from './models';
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

// ---- range-aware charts ----

/** `count` consecutive days ending 2026-09-20, each with the given steps and state. */
const dayRecords = (count: number, steps = (i: number) => 1000 * (i + 1)): DayRecord[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(2026, 8, 20 - (count - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      day: key,
      steps: steps(i),
      goal: 5000,
      state: steps(i) >= 5000 ? 'goal' : steps(i) > 0 ? 'partial' : 'none',
      chosenRest: false,
      isToday: i === count - 1,
      future: false,
    };
  });

describe('bucketSteps', () => {
  const history = dayRecords(180);

  it('week: seven daily bars with weekday letters', () => {
    const bars = bucketSteps(history, 'Week');
    expect(bars).toHaveLength(7);
    // 2026-09-20 is a Sunday
    expect(bars.map((b) => b.label).join('')).toBe('MTWTFSS');
    expect(bars[6].value).toBe(history[179].steps);
  });

  it('month: thirty daily bars without labels', () => {
    const bars = bucketSteps(history, 'Month');
    expect(bars).toHaveLength(30);
    expect(bars.every((b) => b.label === '')).toBe(true);
  });

  it('6 months: weekly averages, so the shape differs from the daily views', () => {
    const bars = bucketSteps(history, '6 months');
    expect(bars.length).toBeGreaterThan(20);
    expect(bars.length).toBeLessThanOrEqual(25);
    // The last bar averages the last 7 days.
    const last7 = history.slice(-7);
    const avg = Math.round(last7.reduce((s, d) => s + d.steps, 0) / 7);
    expect(bars[bars.length - 1].value).toBe(avg);
  });

  it('6 months: labels a month initial where a new month starts, and nowhere else', () => {
    const labels = bucketSteps(history, '6 months').map((b) => b.label);
    expect(labels.filter(Boolean).length).toBeGreaterThanOrEqual(5);
    expect(labels.filter(Boolean).length).toBeLessThanOrEqual(7);
    expect(labels[0]).not.toBe('');
  });

  it('6 months: a week with no steps data is empty, not zero-goal', () => {
    const bars = bucketSteps(dayRecords(14, () => 0), '6 months');
    expect(bars.map((b) => b.state)).toEqual(['none', 'none']);
  });

  it('copes with less history than the range', () => {
    expect(bucketSteps(dayRecords(3), 'Week')).toHaveLength(3);
    expect(bucketSteps(dayRecords(3), '6 months')).toHaveLength(1);
    expect(bucketSteps([], '6 months')).toEqual([]);
  });

  it('exposes the days in each range', () => {
    expect(RANGE_DAYS).toEqual({ Week: 7, Month: 30, '6 months': 180 });
  });
});

describe('weightTrendFor', () => {
  const now = new Date(2026, 8, 20, 12, 0);
  const entry = (daysAgo: number, lb: number) => ({
    id: String(daysAgo),
    lb,
    loggedAt: new Date(2026, 8, 20 - daysAgo, 7, 0).toISOString(),
  });
  // newest first: 170 today ... older readings heavier
  const entries = [entry(0, 170), entry(3, 171), entry(10, 173), entry(40, 176), entry(100, 180)];

  it('a week holds only the readings from the last seven days', () => {
    expect(weightTrendFor(entries, 7, now)).toHaveLength(2);
  });

  it('a month reaches back thirty days, six months further, and everything reaches all of them', () => {
    expect(weightTrendFor(entries, 30, now)).toHaveLength(3);
    expect(weightTrendFor(entries, 180, now)).toHaveLength(5);
    expect(weightTrendFor(entries, Infinity, now)).toHaveLength(5);
  });

  it('is empty when nothing falls in the range or nothing is logged', () => {
    expect(weightTrendFor([entry(50, 175)], 7, now)).toEqual([]);
    expect(weightTrendFor([], 30, now)).toEqual([]);
  });

  it('a shorter range is the end of the longer one, so the line does not change shape', () => {
    const month = weightTrendFor(entries, 30, now);
    const all = weightTrendFor(entries, Infinity, now);
    expect(all.slice(-month.length)).toEqual(month);
  });
});
