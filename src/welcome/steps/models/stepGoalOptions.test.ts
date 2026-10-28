import { stepGoalOptions } from './stepGoalOptions';

describe('stepGoalOptions', () => {
  it('adds the current goal among the presets, in order', () => {
    expect(stepGoalOptions(4800)).toEqual([4800, 5000, 7500, 10000]);
  });

  it("doesn't repeat a goal that is already a preset", () => {
    expect(stepGoalOptions(7500)).toEqual([5000, 7500, 10000]);
  });
});
