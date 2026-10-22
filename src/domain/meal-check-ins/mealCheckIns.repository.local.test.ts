import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { Meal } from '../food/models/foodEntry';
import { createLocalMealCheckInsRepository } from './mealCheckIns.repository.local';
import {
  createMemoryMealCheckInsRepository,
  type MealCheckInsRepository,
} from './mealCheckIns.repository';

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<MealCheckInsRepository>]>([
  ['memory', async () => createMemoryMealCheckInsRepository()],
  [
    'local',
    async () => createLocalMealCheckInsRepository(await createMigratedSqlJsDb()),
  ],
])('%s meal check-ins repository', (_name, create) => {
  it('keeps one check-in per meal and day, replacing it note and all', async () => {
    const repo = await create();
    await repo.save({
      day: '2026-10-18',
      meal: Meal.Lunch,
      fullness: 3,
      feeling: 4,
      note: 'Ate outside',
    });
    await repo.save({ day: '2026-10-18', meal: Meal.Lunch, fullness: 4, feeling: 4 });
    await repo.save({ day: '2026-10-18', meal: Meal.Dinner, fullness: 2, feeling: 3 });
    const loaded = await repo.load('2026-10-18', '2026-10-18');
    expect(loaded).toHaveLength(2);
    expect(loaded).toContainEqual({
      day: '2026-10-18',
      meal: Meal.Lunch,
      fullness: 4,
      feeling: 4,
    });
  });

  it('keeps a note, and removes one meal without touching the other', async () => {
    const repo = await create();
    await repo.save({
      day: '2026-10-18',
      meal: Meal.Lunch,
      fullness: 3,
      feeling: 4,
      note: 'Ate outside',
    });
    await repo.save({ day: '2026-10-18', meal: Meal.Dinner, fullness: 2, feeling: 3 });
    await repo.remove('2026-10-18', Meal.Dinner);
    expect(await repo.load('2026-10-01', '2026-10-31')).toEqual([
      {
        day: '2026-10-18',
        meal: Meal.Lunch,
        fullness: 3,
        feeling: 4,
        note: 'Ate outside',
      },
    ]);
  });
});
