import { type FoodEntry, Meal } from '../../food/models/foodEntry';
import {
  cleanName,
  cleanServings,
  dominantTier,
  filterMeals,
  findMealByName,
  isRecipe,
  itemsToEntries,
  recipeEntry,
  savedMealTotals,
  snapshotItems,
  sortMeals,
  typedEaten,
  typedYield,
  validateMealName,
  type SavedMeal,
  SavedMealLimits,
} from './savedMeals';
import { amountOf } from '../../food/models/measure';

const entry = (name: string, over: Partial<FoodEntry> = {}): FoodEntry => ({
  id: `id-${name}`,
  name,
  meal: Meal.Breakfast,
  servings: 1,
  servingLabel: '1 serving',
  calories: 100,
  protein: 5,
  carbs: 10,
  fat: 2,
  tier: 1,
  ...over,
});

const meal = (name: string): SavedMeal => ({
  id: name,
  name,
  items: [],
  servings: 1,
  createdAt: '2026-09-20T00:00:00Z',
});

describe('names', () => {
  it('cleans spacing and compares ignoring case', () => {
    expect(cleanName('  Usual   breakfast ')).toBe('Usual breakfast');
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
      entry('Oats', {
        servings: 1,
        servingLabel: '40 g',
        calories: 150,
        tier: 3,
        tierOverridden: true,
        brand: 'Quaker',
      }),
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
    const many = Array.from({ length: SavedMealLimits.MAX_ITEMS + 5 }, (_, i) =>
      entry(`Food ${i}`),
    );
    expect(snapshotItems(many)).toHaveLength(SavedMealLimits.MAX_ITEMS);
  });

  it('turns saved items back into entries for whichever meal you choose', () => {
    const entries = itemsToEntries(
      snapshotItems([entry('Oats'), entry('Banana')]),
      Meal.Dinner,
    );
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
    expect(savedMealTotals(items)).toMatchObject({
      calories: 250,
      protein: 11,
    });
  });
});

describe('finding and filtering', () => {
  const meals = [
    meal('Usual breakfast'),
    meal('chili night'),
    meal('Big Salad'),
  ];

  it('finds a meal by name ignoring case', () => {
    expect(findMealByName(meals, ' USUAL breakfast ')?.id).toBe(
      'Usual breakfast',
    );
    expect(findMealByName(meals, 'pizza')).toBeUndefined();
  });

  it('sorts by name, ignoring case, without changing the original', () => {
    expect(sortMeals(meals).map((m) => m.name)).toEqual([
      'Big Salad',
      'chili night',
      'Usual breakfast',
    ]);
    expect(meals[0].name).toBe('Usual breakfast');
  });

  it('filters by every word of the query', () => {
    expect(filterMeals(meals, '')).toHaveLength(3);
    expect(filterMeals(meals, 'breakfast').map((m) => m.name)).toEqual([
      'Usual breakfast',
    ]);
    expect(filterMeals(meals, 'big sal').map((m) => m.name)).toEqual([
      'Big Salad',
    ]);
    expect(filterMeals(meals, 'nope')).toEqual([]);
  });
});

describe('measured items', () => {
  const eggs = amountOf({
    per100: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
    portions: [{ label: 'large egg', grams: 50 }],
    unit: 'large egg',
    quantity: 2,
  });

  it('keeps how an item was measured when a meal is saved', () => {
    const [item] = snapshotItems([entry('Eggs', { ...eggs })]);
    expect(item.measure).toEqual(eggs.measure);
  });

  it('scales a measured meal by its amount, so half of two eggs is one egg', () => {
    const [half] = itemsToEntries(
      snapshotItems([entry('Eggs', { ...eggs })]),
      Meal.Lunch,
      0.5,
    );
    expect(half).toMatchObject({
      servings: 1,
      servingLabel: '1 large egg (50 g)',
      calories: 72,
    });
    expect(half.measure?.quantity).toBe(1);
  });

  it('logs a measured item as saved at full scale', () => {
    const [same] = itemsToEntries(
      snapshotItems([entry('Eggs', { ...eggs })]),
      Meal.Lunch,
    );
    expect(same).toMatchObject({
      servings: 1,
      servingLabel: '2 large eggs (100 g)',
      calories: 143,
    });
  });
});

describe('recipes', () => {
  const chili = {
    name: 'Chili',
    servings: 8,
    items: snapshotItems([
      entry('Beef', {
        servings: 2,
        calories: 400,
        protein: 40,
        carbs: 0,
        fat: 20,
        tier: 1,
      }),
      entry('Beans', {
        servings: 4,
        calories: 200,
        protein: 12,
        carbs: 36,
        fat: 1,
        tier: 2,
      }),
    ]),
  };

  it('is a saved meal that makes more than one serving', () => {
    expect(isRecipe({ servings: 1 })).toBe(false);
    expect(isRecipe({ servings: 2 })).toBe(true);
  });

  it('logs one entry per serving eaten, with the batch divided by its yield', () => {
    // Batch: 1600 cal, 128 g protein, 144 g carbs, 44 g fat.
    for (const eaten of [0.5, 1, 1.5]) {
      expect(recipeEntry(chili, eaten, Meal.Dinner)).toEqual({
        name: 'Chili',
        meal: Meal.Dinner,
        servings: eaten,
        servingLabel: '1 serving',
        calories: 200,
        protein: 16,
        carbs: 18,
        fat: 5.5,
        tier: 2,
        tierOverridden: false,
      });
    }
    expect(recipeEntry(chili, 1.5, Meal.Dinner)).not.toHaveProperty('measure');
  });

  it('gives the entry the tier of the foods making most of the calories', () => {
    // Beef (tier 1) and beans (tier 2) are 800 calories each: the higher tier wins.
    expect(dominantTier(chili.items)).toBe(2);
    expect(recipeEntry(chili, 1, Meal.Dinner).tier).toBe(2);
  });

  it('picks the tier with the most calories', () => {
    const items = snapshotItems([
      entry('A', { calories: 100, tier: 1 }),
      entry('B', { calories: 300, tier: 3 }),
      entry('C', { calories: 150, tier: 1 }),
    ]);
    expect(dominantTier(items)).toBe(3);
    expect(
      dominantTier(
        snapshotItems([
          entry('A', { calories: 300, tier: 1 }),
          entry('B', { calories: 100, tier: 4 }),
          entry('C', { calories: 100, tier: 1 }),
        ]),
      ),
    ).toBe(1);
  });

  it('breaks a tie towards the higher tier', () => {
    const items = snapshotItems([
      entry('A', { calories: 200, tier: 2 }),
      entry('B', { calories: 200, tier: 4 }),
      entry('C', { calories: 200, tier: 1 }),
    ]);
    expect(dominantTier(items)).toBe(4);
  });

  it('keeps servings whole and within limits', () => {
    expect(cleanServings(8)).toBe(8);
    expect(cleanServings(7.6)).toBe(8);
    expect(cleanServings(0)).toBe(SavedMealLimits.MIN_SERVINGS);
    expect(cleanServings(500)).toBe(SavedMealLimits.MAX_SERVINGS);
    expect(cleanServings('8')).toBe(1);
    expect(cleanServings(undefined)).toBe(1);
  });

  it('reads typed amounts', () => {
    expect(typedYield('12')).toBe(12);
    expect(typedYield('')).toBeNull();
    expect(typedYield('0')).toBeNull();
    expect(typedYield('900')).toBe(SavedMealLimits.MAX_SERVINGS);
    expect(typedEaten('1.5')).toBe(1.5);
    expect(typedEaten('1,3')).toBe(1.25);
    expect(typedEaten('0.1')).toBe(0.25);
    expect(typedEaten('.')).toBeNull();
    expect(typedEaten('0')).toBeNull();
  });
});
