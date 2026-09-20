import type { FoodEntry } from './models';
import {
  MAX_MEAL_ITEMS,
  cleanName,
  filterMeals,
  findMealByName,
  itemsToEntries,
  sameName,
  savedMealTotals,
  snapshotItems,
  sortMeals,
  validateMealName,
  type SavedMeal,
} from './savedMeals';

const entry = (name: string, over: Partial<FoodEntry> = {}): FoodEntry => ({
  id: `id-${name}`,
  name,
  meal: 'breakfast',
  servings: 1,
  servingLabel: '1 serving',
  calories: 100,
  protein: 5,
  carbs: 10,
  fat: 2,
  tier: 1,
  ...over,
});

const meal = (name: string): SavedMeal => ({ id: name, name, items: [], createdAt: '2026-09-20T00:00:00Z' });

describe('names', () => {
  it('cleans spacing and compares ignoring case', () => {
    expect(cleanName('  Usual   breakfast ')).toBe('Usual breakfast');
    expect(sameName('Usual breakfast', '  usual  BREAKFAST')).toBe(true);
    expect(sameName('Lunch', 'Dinner')).toBe(false);
  });

  it('asks for a name, of sensible length', () => {
    expect(validateMealName('')).toMatch(/name/i);
    expect(validateMealName('   ')).toMatch(/name/i);
    expect(validateMealName('a'.repeat(61))).toMatch(/60/);
    expect(validateMealName('Usual breakfast')).toBeNull();
    expect(validateMealName('a'.repeat(60))).toBeNull();
  });
});

describe('snapshotItems / itemsToEntries', () => {
  it('keeps portions and the food type you chose, and drops ids and the meal', () => {
    const items = snapshotItems([
      entry('Oats', { servings: 1, servingLabel: '40 g', calories: 150, tier: 3, tierOverridden: true, brand: 'Quaker' }),
    ]);
    expect(items).toEqual([
      {
        name: 'Oats',
        brand: 'Quaker',
        servings: 1,
        servingLabel: '40 g',
        calories: 150,
        protein: 5,
        carbs: 10,
        fat: 2,
        tier: 3,
        tierOverridden: true,
      },
    ]);
    expect(items[0]).not.toHaveProperty('id');
    expect(items[0]).not.toHaveProperty('meal');
  });

  it('stops at the item limit', () => {
    const many = Array.from({ length: MAX_MEAL_ITEMS + 5 }, (_, i) => entry(`Food ${i}`));
    expect(snapshotItems(many)).toHaveLength(MAX_MEAL_ITEMS);
  });

  it('turns saved items back into entries for whichever meal you choose', () => {
    const entries = itemsToEntries(snapshotItems([entry('Oats'), entry('Banana')]), 'dinner');
    expect(entries.map((e) => [e.name, e.meal])).toEqual([
      ['Oats', 'dinner'],
      ['Banana', 'dinner'],
    ]);
    expect(entries[0]).not.toHaveProperty('id');
  });
});

describe('totals', () => {
  it('adds up calories and macros across the items and servings', () => {
    const items = snapshotItems([
      entry('A', { calories: 100, servings: 2, protein: 5 }),
      entry('B', { calories: 50, servings: 1, protein: 1 }),
    ]);
    expect(savedMealTotals(items)).toMatchObject({ calories: 250, protein: 11 });
  });
});

describe('finding and filtering', () => {
  const meals = [meal('Usual breakfast'), meal('chili night'), meal('Big Salad')];

  it('finds a meal by name ignoring case', () => {
    expect(findMealByName(meals, ' USUAL breakfast ')?.id).toBe('Usual breakfast');
    expect(findMealByName(meals, 'pizza')).toBeUndefined();
  });

  it('sorts by name, ignoring case, without changing the original', () => {
    expect(sortMeals(meals).map((m) => m.name)).toEqual(['Big Salad', 'chili night', 'Usual breakfast']);
    expect(meals[0].name).toBe('Usual breakfast');
  });

  it('filters by every word of the query', () => {
    expect(filterMeals(meals, '')).toHaveLength(3);
    expect(filterMeals(meals, 'breakfast').map((m) => m.name)).toEqual(['Usual breakfast']);
    expect(filterMeals(meals, 'big sal').map((m) => m.name)).toEqual(['Big Salad']);
    expect(filterMeals(meals, 'nope')).toEqual([]);
  });
});
