import { addDays } from '@shared/utils/date';
import { DayState } from '@shared/models/dayState';
import { buildDays, computeStreak, withFreezes } from './dayRecord';

const TODAY = '2026-10-08'; // a Thursday

const build = (opts: {
  steps?: Record<string, number>;
  minutes?: Record<string, number>;
  rest?: string[];
  movementGoal?: number;
}) =>
  buildDays({
    stepsByDay: opts.steps ?? {},
    restDays: new Set(opts.rest ?? []),
    goalFor: () => 8000,
    restPerWeek: 2,
    autoDetect: false,
    today: TODAY,
    count: 7,
    minutesByDay: opts.minutes ?? {},
    movementGoal: opts.movementGoal ?? 30,
  });

const on = (offset: number) => addDays(TODAY, offset);

describe('buildDays with movement', () => {
  it('makes a goal day from enough movement when steps fall short', () => {
    const days = build({ steps: { [on(-1)]: 2000 }, minutes: { [on(-1)]: 35 } });
    const y = days.find((d) => d.day === on(-1))!;
    expect(y.state).toBe(DayState.Goal);
    expect(y).toMatchObject({ minutes: 35, movedToGoal: true });
  });

  it('counts a day once when both steps and movement reach their goals', () => {
    const days = build({ steps: { [on(-1)]: 9000 }, minutes: { [on(-1)]: 45 } });
    const y = days.find((d) => d.day === on(-1))!;
    expect(y.state).toBe(DayState.Goal);
    expect(y.movedToGoal).toBe(false); // steps got there; movement didn't need to
  });

  it('leaves a day short of both as it was', () => {
    const days = build({ steps: { [on(-1)]: 2000 }, minutes: { [on(-1)]: 20 } });
    expect(days.find((d) => d.day === on(-1))!.state).toBe(DayState.Partial);
  });

  it('ignores movement when it does not count toward goal days', () => {
    const days = build({ steps: { [on(-1)]: 2000 }, minutes: { [on(-1)]: 90 }, movementGoal: 0 });
    expect(days.find((d) => d.day === on(-1))!.state).toBe(DayState.Partial);
  });

  it('turns a rest day reached by movement into a goal day, giving the rest day back', () => {
    const days = build({ minutes: { [on(-1)]: 40 }, rest: [on(-1)] });
    expect(days.find((d) => d.day === on(-1))!.state).toBe(DayState.Goal);
  });

  it('keeps the streak going through a goal day reached by movement', () => {
    const steps = { [on(-3)]: 9000, [on(-2)]: 9000, [on(0)]: 9000 };
    const without = withFreezes(build({ steps })).days;
    const withSwim = withFreezes(build({ steps, minutes: { [on(-1)]: 35 } })).days;
    expect(computeStreak(withSwim)).toBe(4);
    expect(computeStreak(withSwim)).toBeGreaterThan(computeStreak(without));
  });
});
