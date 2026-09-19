import {
  allMealsLogged,
  mealTotals,
  dayTotals,
  CORE_MEALS,
  type FoodEntry,
} from './models';

function entry(overrides: Partial<FoodEntry>): FoodEntry {
  return {
    id: 'x',
    name: 'Test food',
    meal: 'breakfast',
    servings: 1,
    servingLabel: '1 serving',
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 10,
    tier: 1,
    ...overrides,
  };
}

describe('allMealsLogged', () => {
  it('is false for an empty log', () => {
    expect(allMealsLogged([])).toBe(false);
  });

  it('is false when a core meal is missing', () => {
    const log = [
      entry({ id: 'a', meal: 'breakfast' }),
      entry({ id: 'b', meal: 'lunch' }),
    ];
    expect(allMealsLogged(log)).toBe(false);
  });

  it('is true once every core meal has at least one entry', () => {
    const log = CORE_MEALS.map((meal, i) => entry({ id: `m${i}`, meal }));
    expect(allMealsLogged(log)).toBe(true);
  });

  it('ignores snack entries — they do not count toward coverage', () => {
    const log = [
      entry({ id: 'a', meal: 'breakfast' }),
      entry({ id: 'b', meal: 'lunch' }),
      entry({ id: 'c', meal: 'snack' }),
    ];
    expect(allMealsLogged(log)).toBe(false);
  });
});

describe('mealTotals', () => {
  it('sums calories for a single meal, scaled by servings', () => {
    const log = [
      entry({ id: 'a', meal: 'lunch', calories: 200, servings: 1 }),
      entry({ id: 'b', meal: 'lunch', calories: 100, servings: 2 }),
      entry({ id: 'c', meal: 'dinner', calories: 500, servings: 1 }),
    ];
    expect(mealTotals(log, 'lunch')).toBe(400);
  });

  it('returns 0 for a meal with no entries', () => {
    expect(mealTotals([], 'breakfast')).toBe(0);
  });
});

describe('dayTotals', () => {
  it('sums calories and macros across the whole log, scaled by servings', () => {
    const log = [
      entry({
        id: 'a',
        calories: 100,
        protein: 5,
        carbs: 10,
        fat: 2,
        servings: 1,
      }),
      entry({
        id: 'b',
        calories: 200,
        protein: 15,
        carbs: 20,
        fat: 8,
        servings: 2,
      }),
    ];
    expect(dayTotals(log)).toEqual({
      calories: 500,
      protein: 35,
      carbs: 50,
      fat: 18,
    });
  });

  it('returns all zeros for an empty log', () => {
    expect(dayTotals([])).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});
