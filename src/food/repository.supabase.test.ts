import { patchToRow, rowToFood } from './repository.supabase';

describe('food row mapping', () => {
  it('maps a database row (numerics may arrive as strings) to a FoodEntry', () => {
    const entry = rowToFood({
      id: 'abc',
      logged_on: '2026-09-18',
      meal: 'lunch',
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
    expect(patchToRow({ meal: 'dinner', servings: 2 })).toEqual({
      meal: 'dinner',
      servings: 2,
    });
    expect(patchToRow({})).toEqual({});
  });
});
