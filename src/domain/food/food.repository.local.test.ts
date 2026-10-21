import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { type FoodEntry, Meal } from './models/foodEntry';
import { createLocalFoodRepository } from './food.repository.local';

const toast: FoodEntry = {
  id: 'toast',
  name: 'Toast',
  meal: Meal.Breakfast,
  servings: 2,
  servingLabel: '1 slice',
  calories: 80,
  protein: 3,
  carbs: 15,
  fat: 1,
  tier: 3,
};

const egg: FoodEntry = {
  id: 'egg',
  name: 'Egg',
  brand: 'Happy Hens',
  meal: Meal.Breakfast,
  servings: 1,
  servingLabel: '2 large eggs (100 g)',
  calories: 143,
  protein: 12.6,
  carbs: 0.7,
  fat: 9.5,
  tier: 1,
  tierOverridden: true,
  measure: {
    per100: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
    portions: [{ label: 'large egg', grams: 50 }],
    unit: 'large egg',
    quantity: 2,
  },
};

const create = async () => createLocalFoodRepository(await createMigratedSqlJsDb());

// The memory version keeps one day, so this one is tested on its own.
describe('local food repository', () => {
  it('loads a day in the order it was logged, brand, override and measure intact', async () => {
    const repo = await create();
    await repo.add('2026-10-18', toast);
    await repo.add('2026-10-18', egg);
    await repo.add('2026-10-19', { ...toast, id: 'other' });
    expect(await repo.load('2026-10-18')).toEqual([
      { ...toast, brand: undefined, tierOverridden: undefined, measure: undefined },
      egg,
    ]);
  });

  it('groups history by day, leaving out days with nothing logged', async () => {
    const repo = await create();
    await repo.add('2026-10-16', toast);
    await repo.add('2026-10-18', egg);
    const history = await repo.history('2026-10-15', '2026-10-18');
    expect(Object.keys(history).sort()).toEqual(['2026-10-16', '2026-10-18']);
    expect(history['2026-10-18'].map((e) => e.id)).toEqual(['egg']);
  });

  it('updates only the fields in a patch, and removes an entry', async () => {
    const repo = await create();
    await repo.add('2026-10-18', egg);
    await repo.update('egg', { servings: 1.5, meal: Meal.Lunch });
    await repo.update('egg', {});
    expect(await repo.load('2026-10-18')).toEqual([
      { ...egg, servings: 1.5, meal: Meal.Lunch },
    ]);
    await repo.remove('egg');
    expect(await repo.load('2026-10-18')).toEqual([]);
  });

  it('marks a meal "nothing today" once, by day, and unmarks it', async () => {
    const repo = await create();
    await repo.setSkipped('2026-10-18', Meal.Lunch, true);
    await repo.setSkipped('2026-10-18', Meal.Lunch, true);
    await repo.setSkipped('2026-10-19', Meal.Dinner, true);
    expect(await repo.loadSkipped('2026-10-18')).toEqual([Meal.Lunch]);
    expect(await repo.skippedHistory('2026-10-18', '2026-10-19')).toEqual({
      '2026-10-18': [Meal.Lunch],
      '2026-10-19': [Meal.Dinner],
    });
    await repo.setSkipped('2026-10-18', Meal.Lunch, false);
    expect(await repo.loadSkipped('2026-10-18')).toEqual([]);
  });
});
