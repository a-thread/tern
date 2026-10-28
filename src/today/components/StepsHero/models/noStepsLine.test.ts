import { StepsStatus } from '@/domain/activity/models/stepsStatus';
import { noStepsLine } from './noStepsLine';

const base = {
  status: StepsStatus.NeedsPermission,
  readSteps: true,
  isToday: true,
  movementGoal: 0,
};

describe('noStepsLine', () => {
  it('says nothing while steps are read', () => {
    expect(noStepsLine({ ...base, status: StepsStatus.Connected })).toBeNull();
  });

  it('says nothing on a past day', () => {
    expect(noStepsLine({ ...base, isToday: false })).toBeNull();
  });

  it('offers to connect when permission is missing', () => {
    expect(noStepsLine(base)).toEqual({
      text: 'Connect steps to start a streak ›',
      opensHealthData: true,
    });
  });

  it('points at the switch when reading steps is turned off', () => {
    expect(
      noStepsLine({ ...base, status: StepsStatus.Connected, readSteps: false }),
    ).toEqual({ text: 'Reading steps is off ›', opensHealthData: true });
  });

  it('never links where nothing can connect', () => {
    expect(noStepsLine({ ...base, status: StepsStatus.Unavailable })).toEqual({
      text: "Steps can't be read on this phone",
      opensHealthData: false,
    });
  });

  it('names movement as the other way to a goal day', () => {
    expect(noStepsLine({ ...base, movementGoal: 30 })?.text).toBe(
      'Connect steps, or move 30 min for a goal day ›',
    );
    expect(
      noStepsLine({
        ...base,
        status: StepsStatus.Unavailable,
        movementGoal: 30,
      })?.text,
    ).toBe('30 min of movement makes a goal day');
  });
});
