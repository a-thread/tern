import { TrendRanges, TrendRange } from './trendRange';
import { bucketSteps, stepsValue } from './stepBars';
import { longestConsecutiveStreak, summarizeSteps } from './stepsSummary';
import { weightTrendDaysFor, weightTrendFor } from './weightTrend';
import { DayRecord } from '../../domain/activity/models/dayRecord';
import { DayState } from '@shared/models/dayState';

describe('longestConsecutiveStreak', () => {
  it('returns 0 for an empty array', () => {
    expect(longestConsecutiveStreak([])).toBe(0);
  });

  it('counts a streak of goal days', () => {
    const days: DayState[] = [DayState.Goal, DayState.Goal, DayState.Goal];
    expect(longestConsecutiveStreak(days)).toBe(3);
  });

  it('treats rest days as protecting the streak, not breaking it', () => {
    const days: DayState[] = [
      DayState.Goal,
      DayState.Rest,
      DayState.Goal,
      DayState.Goal,
    ];
    expect(longestConsecutiveStreak(days)).toBe(4);
  });

  it('breaks the streak on a partial or missed day', () => {
    const days: DayState[] = [
      DayState.Goal,
      DayState.Goal,
      DayState.Partial,
      DayState.Goal,
      DayState.Goal,
      DayState.Goal,
    ];
    expect(longestConsecutiveStreak(days)).toBe(3);
  });

  it('resets on none (missed) days', () => {
    const days: DayState[] = [
      DayState.Goal,
      DayState.Goal,
      DayState.None,
      DayState.Goal,
    ];
    expect(longestConsecutiveStreak(days)).toBe(2);
  });
});

describe('summarizeSteps', () => {
  const rec = (i: number, steps: number): DayRecord => ({
    day: `d${i}`,
    steps,
    goal: 8000,
    minutes: 0,
    movedToGoal: false,
    reachedGoal: false,
    state: DayState.Partial,
    chosenRest: false,
    isToday: false,
    future: false,
  });
  const series = (values: number[]) => values.map((v, i) => rec(i, v));

  it('averages only days that have step data', () => {
    expect(summarizeSteps(series([0, 6000, 8000]), 3).average).toBe(7000);
  });

  it('is null without any data', () => {
    expect(summarizeSteps(series([0, 0, 0]), 3)).toEqual({
      average: null,
      changePct: null,
    });
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
const dayRecords = (
  count: number,
  steps = (i: number) => 1000 * (i + 1),
): DayRecord[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(2026, 8, 20 - (count - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      day: key,
      steps: steps(i),
      goal: 5000,
      minutes: 0,
      movedToGoal: false,
      reachedGoal: steps(i) >= 5000,
      state:
        steps(i) >= 5000
          ? DayState.Goal
          : steps(i) > 0
            ? DayState.Partial
            : DayState.None,
      chosenRest: false,
      isToday: i === count - 1,
      future: false,
    };
  });

describe('bucketSteps', () => {
  const history = dayRecords(180);

  it('week: seven daily bars with weekday letters', () => {
    const bars = bucketSteps(history, TrendRange.Week);
    expect(bars).toHaveLength(7);
    // 2026-09-20 is a Sunday
    expect(bars.map((b) => b.label).join('')).toBe('MTWTFSS');
    expect(bars[6].value).toBe(history[179].steps);
  });

  it('month: thirty daily bars without labels', () => {
    const bars = bucketSteps(history, TrendRange.Month);
    expect(bars).toHaveLength(30);
    expect(bars.every((b) => b.label === '')).toBe(true);
  });

  it('6 months: weekly averages, so the shape differs from the daily views', () => {
    const bars = bucketSteps(history, TrendRange.SixMonths);
    expect(bars.length).toBeGreaterThan(20);
    expect(bars.length).toBeLessThanOrEqual(25);
    // The last bar averages the last 7 days.
    const last7 = history.slice(-7);
    const avg = Math.round(last7.reduce((s, d) => s + d.steps, 0) / 7);
    expect(bars[bars.length - 1].value).toBe(avg);
  });

  it('6 months: labels a month initial where a new month starts, and nowhere else', () => {
    const labels = bucketSteps(history, TrendRange.SixMonths).map(
      (b) => b.label,
    );
    expect(labels.filter(Boolean).length).toBeGreaterThanOrEqual(5);
    expect(labels.filter(Boolean).length).toBeLessThanOrEqual(7);
    expect(labels[0]).not.toBe('');
  });

  it('6 months: a week with no steps data is empty, not zero-goal', () => {
    const bars = bucketSteps(
      dayRecords(14, () => 0),
      TrendRange.SixMonths,
    );
    expect(bars.map((b) => b.state)).toEqual(['none', 'none']);
  });

  it('dates daily bars, so a noted day can be marked, and not weekly ones', () => {
    const week = bucketSteps(history, TrendRange.Week);
    expect(week.map((b) => b.day)).toEqual(history.slice(-7).map((d) => d.day));
    expect(
      bucketSteps(history, TrendRange.SixMonths).every(
        (b) => b.day === undefined,
      ),
    ).toBe(true);
  });

  it('gives each weekly bar the seven days it covers, so a tap can name them', () => {
    const bars = bucketSteps(history, TrendRange.SixMonths);
    expect(bars[bars.length - 1].week).toEqual({
      from: history[173].day,
      to: history[179].day,
    });
    expect(bucketSteps(history, TrendRange.Week)[0].week).toBeUndefined();
  });

  it('reads a tapped bar as steps, a day on average for a week', () => {
    expect(
      stepsValue({ label: '', value: 8410, state: DayState.Goal, day: 'x' }),
    ).toBe(`${(8410).toLocaleString()} steps`);
    expect(
      stepsValue({
        label: '',
        value: 8410,
        state: DayState.Goal,
        week: { from: 'a', to: 'b' },
      }),
    ).toBe(`${(8410).toLocaleString()} steps a day`);
  });

  it('copes with less history than the range', () => {
    expect(bucketSteps(dayRecords(3), TrendRange.Week)).toHaveLength(3);
    expect(bucketSteps(dayRecords(3), TrendRange.SixMonths)).toHaveLength(1);
    expect(bucketSteps([], TrendRange.SixMonths)).toEqual([]);
  });

  it('exposes the days in each range', () => {
    expect(TrendRanges.DAYS).toEqual({ Week: 7, Month: 30, '6 months': 180 });
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
  const entries = [
    entry(0, 170),
    entry(3, 171),
    entry(10, 173),
    entry(40, 176),
    entry(100, 180),
  ];

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

  it('dates each point of the line, oldest first, one per point', () => {
    expect(weightTrendDaysFor(entries, 7, now)).toEqual([
      '2026-09-17',
      '2026-09-20',
    ]);
    expect(weightTrendDaysFor(entries, 180, now)).toHaveLength(
      weightTrendFor(entries, 180, now).length,
    );
    expect(weightTrendDaysFor([], 30, now)).toEqual([]);
  });
});
