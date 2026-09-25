import type { FoodEntry } from './models';
import {
  dayLabel,
  filterRecentMeals,
  recentMealTitle,
  recentMeals,
} from './recentMeals';

const TODAY = '2026-09-24'; // a Thursday

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

describe('dayLabel', () => {
  it('names the days close enough to have names', () => {
    expect(dayLabel(TODAY, TODAY)).toBe('Today');
    expect(dayLabel('2026-09-23', TODAY)).toBe('Yesterday');
    expect(dayLabel('2026-09-21', TODAY)).toBe('Monday');
  });

  it('falls back to a date once a weekday would be ambiguous', () => {
    // A week back is the same weekday as today, so it's a date from there on.
    expect(dayLabel('2026-09-17', TODAY)).toBe('Sep 17');
    expect(dayLabel('2026-09-12', TODAY)).toBe('Sep 12');
  });
});

describe('recentMealTitle', () => {
  it('uses the possessive for a named day', () => {
    expect(recentMealTitle(TODAY, 'lunch', TODAY)).toBe('Today’s lunch');
    expect(recentMealTitle('2026-09-23', 'dinner', TODAY)).toBe('Yesterday’s dinner');
    expect(recentMealTitle('2026-09-21', 'snack', TODAY)).toBe('Monday’s snacks');
  });

  it('puts the meal first when the day is a date', () => {
    expect(recentMealTitle('2026-09-12', 'breakfast', TODAY)).toBe('Breakfast · Sep 12');
  });
});

describe('recentMeals', () => {
  it('groups a day into its meals, newest day first and latest meal first', () => {
    const list = recentMeals(
      {
        '2026-09-23': [
          entry('Oats', { meal: 'breakfast' }),
          entry('Soup', { meal: 'lunch' }),
          entry('Rice', { meal: 'dinner' }),
          entry('Apple', { meal: 'snack' }),
        ],
        [TODAY]: [
          entry('Toast', { meal: 'breakfast' }),
          entry('Salad', { meal: 'lunch' }),
        ],
      },
      { today: TODAY },
    );
    expect(list.map((m) => m.title)).toEqual([
      'Today’s lunch',
      'Today’s breakfast',
      'Yesterday’s dinner',
      'Yesterday’s lunch',
      'Yesterday’s breakfast',
      'Yesterday’s snacks',
    ]);
  });

  it('keeps every food of a meal, with its portion and food type', () => {
    const list = recentMeals(
      {
        [TODAY]: [
          entry('Chili', { meal: 'dinner', servings: 1.5, tier: 3 }),
          entry('Cornbread', { meal: 'dinner' }),
          entry('Toast', { meal: 'breakfast' }),
        ],
      },
      { today: TODAY },
    );
    expect(list[0]).toMatchObject({ id: `${TODAY}-dinner`, day: TODAY, meal: 'dinner' });
    expect(list[0].items).toEqual([
      expect.objectContaining({ name: 'Chili', servings: 1.5, tier: 3 }),
      expect.objectContaining({ name: 'Cornbread' }),
    ]);
  });

  it('respects fromDay and limit, and leaves out days that have nothing', () => {
    const byDay = {
      '2026-08-01': [entry('Old', { meal: 'lunch' })],
      '2026-09-23': [entry('Soup', { meal: 'lunch' })],
      [TODAY]: [entry('Toast', { meal: 'breakfast' }), entry('Salad', { meal: 'lunch' })],
    };
    expect(
      recentMeals(byDay, { today: TODAY, fromDay: '2026-09-11' }).map((m) => m.day),
    ).toEqual([TODAY, TODAY, '2026-09-23']);
    expect(recentMeals(byDay, { today: TODAY, limit: 2 })).toHaveLength(2);
    expect(recentMeals({}, { today: TODAY })).toEqual([]);
  });
});

describe('filterRecentMeals', () => {
  const meals = recentMeals(
    {
      '2026-09-23': [entry('Chicken soup', { meal: 'lunch' })],
      [TODAY]: [entry('Rolled oats', { meal: 'breakfast', brand: "Bob's Red Mill" })],
    },
    { today: TODAY },
  );

  it('returns everything for a blank query', () => {
    expect(filterRecentMeals(meals, '  ')).toHaveLength(2);
  });

  it('matches the foods in a meal, and the day or meal it was', () => {
    expect(filterRecentMeals(meals, 'oats').map((m) => m.meal)).toEqual(['breakfast']);
    expect(filterRecentMeals(meals, 'bob').map((m) => m.meal)).toEqual(['breakfast']);
    expect(filterRecentMeals(meals, 'yesterday').map((m) => m.meal)).toEqual(['lunch']);
    expect(filterRecentMeals(meals, 'pizza')).toEqual([]);
  });
});
