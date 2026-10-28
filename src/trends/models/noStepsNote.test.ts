import { StepsStatus } from '../../domain/activity/models/stepsStatus';
import { noStepsNote } from './noStepsNote';

describe('noStepsNote', () => {
  it('says why steps are missing', () => {
    expect(noStepsNote(StepsStatus.Connected, false)).toMatch(
      /^Reading steps is off/,
    );
    expect(noStepsNote(StepsStatus.NeedsPermission, true)).toMatch(
      /^Connect step data/,
    );
    expect(noStepsNote(StepsStatus.Unavailable, true)).toBe(
      "Steps can't be read on this phone.",
    );
  });
});
