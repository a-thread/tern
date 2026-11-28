import { clampMovementGoal, stepMovementGoal } from './movementGoal';

describe('movementGoal', () => {
  it('keeps a goal within sensible bounds', () => {
    expect(clampMovementGoal(5)).toBe(10);
    expect(clampMovementGoal(500)).toBe(300);
  });

  it('steps by 5 up to an hour, then by 15', () => {
    expect(stepMovementGoal(30, 1)).toBe(35);
    expect(stepMovementGoal(55, 1)).toBe(60);
    expect(stepMovementGoal(60, 1)).toBe(75);
    expect(stepMovementGoal(75, -1)).toBe(60);
    expect(stepMovementGoal(60, -1)).toBe(55);
    expect(stepMovementGoal(300, 1)).toBe(300);
    expect(stepMovementGoal(10, -1)).toBe(10);
  });

  it('lands back on the grid from an odd saved value', () => {
    expect(stepMovementGoal(62, 1)).toBe(75);
    expect(stepMovementGoal(62, -1)).toBe(60);
    expect(stepMovementGoal(33, 1)).toBe(35);
  });
});
