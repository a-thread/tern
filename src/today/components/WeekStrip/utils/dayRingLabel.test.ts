import { dayRingLabel } from './dayRingLabel';
import { DayState } from '@shared/models/dayState';

const base = {
  day: '2026-10-20',
  steps: 4200,
  goal: 8000,
  minutes: 0,
  movedToGoal: false,
  state: DayState.Partial,
  isToday: false,
  future: false,
};

describe('dayRingLabel', () => {
  it('names the date and the steps so far', () => {
    expect(dayRingLabel(base, 30)).toBe(
      'Tuesday, Oct 20, 4,200 of 8,000 steps',
    );
  });

  it('adds minutes moved when movement is tracked', () => {
    expect(dayRingLabel({ ...base, minutes: 12 }, 30)).toBe(
      'Tuesday, Oct 20, 4,200 of 8,000 steps, 12 of 30 minutes moved',
    );
  });

  it('says how a finished day went', () => {
    expect(dayRingLabel({ ...base, state: DayState.Goal }, 30)).toMatch(
      /goal reached$/,
    );
    expect(
      dayRingLabel({ ...base, state: DayState.Goal, movedToGoal: true }, 30),
    ).toMatch(/goal reached by movement$/);
    expect(dayRingLabel({ ...base, state: DayState.Rest }, 30)).toMatch(
      /rest day$/,
    );
    expect(dayRingLabel({ ...base, state: DayState.Frozen }, 30)).toMatch(
      /streak freeze$/,
    );
  });

  it('marks today and days still to come', () => {
    expect(dayRingLabel({ ...base, isToday: true }, 0)).toMatch(/^Today, /);
    expect(dayRingLabel({ ...base, future: true }, 0)).toMatch(/not yet$/);
  });
});
