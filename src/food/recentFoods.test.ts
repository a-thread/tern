import type { FoodEntry } from './models';
import { filterFoods, recentFoods } from './recentFoods';

const entry = (name: string, over: Partial<FoodEntry> = {}): FoodEntry => ({
  id: `${name}-${Math.random()}`,
  name,
  meal: 'lunch',
  servings: 1,
  servingLabel: '1 bowl',
  calories: 200,
  protein: 10,
  carbs: 20,
  fat: 5,
  tier: 1,
  ...over,
});

describe('recentFoods', () => {
  it('lists distinct foods, newest day first and newest entry first within a day', () => {
    const list = recentFoods({
      '2026-09-10': [entry('Chili')],
      '2026-09-12': [entry('Toast'), entry('Eggs')],
    });
    expect(list.map((f) => f.name)).toEqual(['Eggs', 'Toast', 'Chili']);
  });

  it('keeps only the latest version of a repeated food, including a changed tier', () => {
    const list = recentFoods({
      '2026-09-10': [entry('Granola', { tier: 3, calories: 300 })],
      '2026-09-12': [entry('Granola', { tier: 4, calories: 320 })],
    });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ tier: 4, calories: 320 });
  });

  it('treats the same name from different brands as different foods, ignoring case', () => {
    const list = recentFoods({
      '2026-09-12': [
        entry('oat milk', { brand: 'Oatly' }),
        entry('Oat Milk', { brand: 'Silk' }),
        entry('OAT MILK', { brand: 'oatly' }),
      ],
    });
    expect(list).toHaveLength(2);
  });

  it('respects fromDay and limit', () => {
    const byDay = {
      '2026-08-01': [entry('Old')],
      '2026-09-12': [entry('A'), entry('B'), entry('C')],
    };
    expect(recentFoods(byDay, { fromDay: '2026-09-01' }).map((f) => f.name)).toEqual(['C', 'B', 'A']);
    expect(recentFoods(byDay, { limit: 2 })).toHaveLength(2);
  });

  it('is empty with no history', () => {
    expect(recentFoods({})).toEqual([]);
  });
});

describe('filterFoods', () => {
  const foods = recentFoods({
    '2026-09-12': [
      entry('Rolled oats', { brand: "Bob's Red Mill" }),
      entry('Oat milk', { brand: 'Oatly' }),
      entry('Chili'),
    ],
  });

  it('returns everything for a blank query', () => {
    expect(filterFoods(foods, '  ')).toHaveLength(3);
  });

  it('matches every word against name and brand', () => {
    expect(filterFoods(foods, 'oat').map((f) => f.name).sort()).toEqual(['Oat milk', 'Rolled oats']);
    expect(filterFoods(foods, 'oatly milk').map((f) => f.name)).toEqual(['Oat milk']);
    expect(filterFoods(foods, 'pizza')).toEqual([]);
  });
});
