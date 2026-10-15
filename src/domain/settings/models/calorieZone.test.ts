import { sanitizeCalorieZone } from './calorieZone';

describe('calorieZone', () => {
  it('rejects malformed saved zones', () => {
    expect(sanitizeCalorieZone(undefined)).toBeNull();
    expect(sanitizeCalorieZone({ min: 2000, max: 1900 })).toBeNull();
    expect(sanitizeCalorieZone({ min: 'a', max: 2000 })).toBeNull();
    expect(sanitizeCalorieZone({ min: 1500, max: 2000 })).toEqual({
      min: 1500,
      max: 2000,
    });
  });
});
