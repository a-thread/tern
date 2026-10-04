import { patchToRow, rowToFood } from './food.repository.supabase';
import { Meal } from '@food/models/foodEntry';

describe('food row mapping', () => {
  it('maps a database row (numerics may arrive as strings) to a FoodEntry', () => {
    const entry = rowToFood({
      id: 'abc',
      logged_on: '2026-09-18',
      meal: Meal.Lunch,
      name: 'Turkey sandwich',
      brand: null,
      servings: '1.50',
      serving_label: '1 sandwich',
      calories: '460.0',
      protein: 32,
      carbs: 48,
      fat: 14,
      tier: 3,
      tier_overridden: false,
    });
    expect(entry).toMatchObject({
      id: 'abc',
      brand: undefined,
      servings: 1.5,
      calories: 460,
      tier: 3,
      tierOverridden: undefined,
    });
  });

  it('only writes the fields present in a patch', () => {
    expect(patchToRow({ meal: Meal.Dinner, servings: 2 })).toEqual({
      meal: 'dinner',
      servings: 2,
    });
    expect(patchToRow({})).toEqual({});
  });
});

describe('measure column', () => {
  const measure = {
    per100: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
    portions: [{ label: 'large egg', grams: 50 }],
    unit: 'large egg',
    quantity: 2,
  };
  const row = {
    id: 'abc',
    logged_on: '2026-09-18',
    meal: Meal.Breakfast,
    name: 'Egg',
    brand: null,
    servings: 1,
    serving_label: '2 large eggs (100 g)',
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    tier: 1,
    tier_overridden: false,
  };

  it('reads a stored measure, and ignores a missing or damaged one', () => {
    expect(rowToFood({ ...row, measure }).measure).toEqual(measure);
    expect(rowToFood(row).measure).toBeUndefined();
    expect(rowToFood({ ...row, measure: { quantity: 'two' } }).measure).toBeUndefined();
  });

  it('writes the measure only when the patch has one', () => {
    expect(patchToRow({ measure })).toEqual({ measure });
    expect(patchToRow({ servings: 2 })).toEqual({ servings: 2 });
  });
});
