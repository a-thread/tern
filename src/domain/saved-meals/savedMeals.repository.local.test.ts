import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import type { SavedMeal } from './models/savedMeals';
import { createLocalSavedMealsRepository } from './savedMeals.repository.local';
import {
  createMemorySavedMealsRepository,
  type SavedMealsRepository,
} from './savedMeals.repository';

const meal = (id: string, name: string): SavedMeal => ({
  id,
  name,
  createdAt: '2026-10-01T12:00:00.000Z',
  items: [
    {
      name: 'Egg',
      servings: 1,
      servingLabel: '2 large eggs (100 g)',
      calories: 143,
      protein: 12.6,
      carbs: 0.7,
      fat: 9.5,
      tier: 1,
      measure: {
        per100: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
        portions: [{ label: 'large egg', grams: 50 }],
        unit: 'large egg',
        quantity: 2,
      },
    },
  ],
});

const byName = (meals: SavedMeal[]) =>
  [...meals].sort((a, b) => a.name.localeCompare(b.name));

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<SavedMealsRepository>]>([
  ['memory', async () => createMemorySavedMealsRepository()],
  ['local', async () => createLocalSavedMealsRepository(await createMigratedSqlJsDb())],
])('%s saved meals repository', (_name, create) => {
  it('lists saved meals with their items and measures intact', async () => {
    const repo = await create();
    await repo.save(meal('b', 'Lunch box'));
    await repo.save(meal('a', 'Breakfast eggs'));
    expect(byName(await repo.list())).toEqual([
      meal('a', 'Breakfast eggs'),
      meal('b', 'Lunch box'),
    ]);
  });

  it('updates a meal by id, and removes it', async () => {
    const repo = await create();
    await repo.save(meal('a', 'Breakfast eggs'));
    await repo.save({ ...meal('a', 'Weekend eggs'), items: [] });
    expect(await repo.list()).toEqual([{ ...meal('a', 'Weekend eggs'), items: [] }]);
    await repo.remove('a');
    expect(await repo.list()).toEqual([]);
  });
});
