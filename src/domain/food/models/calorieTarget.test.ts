import { CalorieTarget } from './calorieTarget';

describe('CalorieTarget.clamp', () => {
  it('rounds to the step', () => {
    expect(CalorieTarget.clamp(2124)).toBe(2100);
    expect(CalorieTarget.clamp(2126)).toBe(2150);
  });

  it('keeps the target in range', () => {
    expect(CalorieTarget.clamp(500)).toBe(CalorieTarget.MIN);
    expect(CalorieTarget.clamp(9000)).toBe(CalorieTarget.MAX);
  });
});
