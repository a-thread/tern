import { clampMovementGoal } from './movementGoal';

describe('movementGoal', () => {
  it('keeps a goal within sensible bounds', () => {
    expect(clampMovementGoal(5)).toBe(10);
    expect(clampMovementGoal(500)).toBe(120);
  });
});
