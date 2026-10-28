import { showsRestLink } from './restLink';
import { DayState } from '@shared/models/dayState';

const open = {
  todaySteps: 1200,
  stepGoal: 8000,
  todayState: DayState.Partial,
  todayIsRest: false,
  restLeft: 2,
};

describe('showsRestLink', () => {
  it('offers a rest day while one is left', () => {
    expect(showsRestLink(open)).toBe(true);
    expect(showsRestLink({ ...open, restLeft: 0 })).toBe(false);
  });

  it('offers to undo today’s rest day even with none left', () => {
    expect(showsRestLink({ ...open, restLeft: 0, todayIsRest: true })).toBe(
      true,
    );
  });

  it('offers nothing once the goal is reached', () => {
    expect(showsRestLink({ ...open, todaySteps: 8000 })).toBe(false);
    expect(showsRestLink({ ...open, todayState: DayState.Goal })).toBe(false);
  });
});
