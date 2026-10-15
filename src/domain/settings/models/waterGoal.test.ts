import { clampWaterGoal } from './waterGoal';

describe('waterGoal', () => {
  it('keeps a goal within sensible bounds', () => {
    expect(clampWaterGoal(3)).toBe(16);
    expect(clampWaterGoal(9999)).toBe(200);
    expect(clampWaterGoal(64.004)).toBe(64);
  });
});
