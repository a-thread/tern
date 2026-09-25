import {
  allMealsLogged,
  mealTotals,
  dayTotals,
  CORE_MEALS,
  averageIntake,
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

  it('counts a meal marked "nothing today" exactly like a logged one', () => {
    const log = [entry({ id: 'a', meal: 'breakfast' }), entry({ id: 'b', meal: 'dinner' })];
    expect(allMealsLogged(log, ['lunch'])).toBe(true);
    expect(allMealsLogged([], ['breakfast', 'lunch', 'dinner'])).toBe(true);
    expect(allMealsLogged(log, [])).toBe(false);
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

describe('averageIntake', () => {
  const item = (calories: number, protein = 10): FoodEntry => ({
    id: String(calories),
    name: 'x',
    meal: 'lunch',
    servings: 1,
    servingLabel: '1',
    calories,
    protein,
    carbs: 20,
    fat: 5,
    tier: 1,
  });

  it('is null with nothing logged', () => {
    expect(averageIntake({})).toBeNull();
    expect(averageIntake({ '2026-09-01': [] })).toBeNull();
  });

  it('averages over days that have food, not calendar days', () => {
    const a = averageIntake({
      '2026-09-01': [item(1000, 40), item(500, 20)],
      '2026-09-03': [item(1500, 60)],
    });
    expect(a).toEqual({ days: 2, calories: 1500, protein: 60, carbs: 30, fat: 8 });
  });

  it('leaves out today when other days exist, but not when it is the only day', () => {
    const days = { '2026-09-01': [item(2000)], '2026-09-02': [item(500)] };
    expect(averageIntake(days, '2026-09-02')?.calories).toBe(2000);
    expect(averageIntake({ '2026-09-02': [item(500)] }, '2026-09-02')?.calories).toBe(500);
  });
});
