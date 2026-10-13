import { DayState } from '@shared/models/dayState';
import { addDays } from '@shared/utils/date';
import { computeStreak, StreakFreezes, withFreezes, type DayRecord } from './dayRecord';

const TODAY = '2026-10-04';

/** Days oldest to newest ending today, from one state per day. */
const record = (states: DayState[]): DayRecord[] =>
  states.map((state, i) => ({
    day: addDays(TODAY, i - (states.length - 1)),
    steps: state === DayState.Goal ? 9000 : state === DayState.Partial ? 3000 : 0,
    goal: 8000,
    minutes: 0,
    movedToGoal: false,
    state,
    chosenRest: state === DayState.Rest,
    isToday: i === states.length - 1,
    future: false,
  }));

const G = DayState.Goal;
const P = DayState.Partial;
const R = DayState.Rest;
const N = DayState.None;
const goals = (n: number) => Array<DayState>(n).fill(G);

describe('withFreezes', () => {
  it('earns a freeze for every week of goal days, up to two', () => {
    expect(withFreezes(record(goals(6))).freezes).toBe(0);
    expect(withFreezes(record(goals(7))).freezes).toBe(1);
    expect(withFreezes(record(goals(14))).freezes).toBe(2);
    expect(withFreezes(record(goals(21))).freezes).toBe(StreakFreezes.MAX);
  });

  it('spends a freeze on a day that would break the streak, which then holds without adding', () => {
    const { days, streak, freezes } = withFreezes(record([...goals(7), P, G, G]));
    expect(days[7].state).toBe(DayState.Frozen);
    expect(streak).toBe(9); // 7 + 2 goal days; the frozen day adds nothing
    expect(freezes).toBe(0);
  });

  it('covers a day with no steps at all the same way', () => {
    expect(withFreezes(record([...goals(7), N, G])).days[7].state).toBe(DayState.Frozen);
  });

  it('lets the streak end when there is no freeze to spend', () => {
    const { days, streak, freezes } = withFreezes(record([...goals(5), P, G, G]));
    expect(days[5].state).toBe(P);
    expect(streak).toBe(2);
    expect(freezes).toBe(0);
  });

  it('does not spend a freeze on a rest day, which already holds the streak', () => {
    const { days, freezes } = withFreezes(record([...goals(7), R, G]));
    expect(days[7].state).toBe(R);
    expect(freezes).toBe(1);
  });

  it('never judges today while it is still in progress', () => {
    const { days, streak, freezes } = withFreezes(record([...goals(7), P]));
    expect(days[7].state).toBe(P);
    expect(streak).toBe(7);
    expect(freezes).toBe(1);
  });

  it('spends one freeze per missed day, and the next miss ends the streak', () => {
    const { days, streak, freezes } = withFreezes(record([...goals(7), P, P, G]));
    expect(days[7].state).toBe(DayState.Frozen);
    expect(days[8].state).toBe(P);
    expect(streak).toBe(1);
    expect(freezes).toBe(0);
  });

  it('has nothing to protect before a streak starts', () => {
    const { days, freezes } = withFreezes(record([N, P, N, G]));
    expect(days.some((d) => d.state === DayState.Frozen)).toBe(false);
    expect(freezes).toBe(0);
  });

  it('earns the next freeze from the streak that carried on through a frozen day', () => {
    // 7 days earns one, a miss spends it, and seven more goal days earn the next.
    const { streak, freezes } = withFreezes(record([...goals(7), P, ...goals(7)]));
    expect(streak).toBe(14);
    expect(freezes).toBe(1);
  });

  it('leaves the days it was given alone', () => {
    const input = record([...goals(7), P, G]);
    withFreezes(input);
    expect(input[7].state).toBe(P);
  });
});

describe('computeStreak with frozen days', () => {
  it('holds through a frozen day like a rest day, and agrees with the summary', () => {
    const { days, streak } = withFreezes(record([...goals(7), P, G, G]));
    expect(computeStreak(days)).toBe(streak);
  });
});
