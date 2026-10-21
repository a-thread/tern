import type { LocalDb } from '@shared/backend/localDb';
import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { LocalSchema } from '@shared/backend/localSchema';
import { createLocalFoodRepository } from '../food/food.repository.local';
import { Meal } from '../food/models/foodEntry';
import { createLocalSavedMealsRepository } from '../saved-meals/savedMeals.repository.local';
import { createLocalWeightRepository } from '../weight/weight.repository.local';
import type { AppSettings } from './models/appSettings';
import { createLocalDataRepository } from './dataRepository.local';
import { createLocalSettingsRepository } from './settings.repository.local';

async function filled(): Promise<LocalDb> {
  const db = await createMigratedSqlJsDb();
  await createLocalSettingsRepository(db).save({ stepGoal: 8000 } as unknown as AppSettings);
  await createLocalWeightRepository(db).add({
    id: 'w',
    lb: 180,
    loggedAt: '2026-10-18T07:00:00.000Z',
  });
  await createLocalFoodRepository(db).add('2026-10-18', {
    id: 'f',
    name: 'Toast',
    meal: Meal.Breakfast,
    servings: 1,
    servingLabel: '1 slice',
    calories: 80,
    protein: 3,
    carbs: 15,
    fat: 1,
    tier: 3,
  });
  await createLocalSavedMealsRepository(db).save({
    id: 's',
    name: 'Usual',
    createdAt: '2026-10-01T12:00:00.000Z',
    items: [],
  });
  return db;
}

describe('local data repository', () => {
  it('exports everything with stored JSON read back as values', async () => {
    const copy = await createLocalDataRepository(await filled()).exportAll();
    expect(copy.settings).toEqual({ stepGoal: 8000 });
    expect(copy.weight).toEqual([
      { id: 'w', lb: 180, logged_at: '2026-10-18T07:00:00.000Z' },
    ]);
    expect(copy.food).toEqual([
      expect.objectContaining({ id: 'f', tier_overridden: false, measure: null }),
    ]);
    expect(copy.savedMeals).toEqual([expect.objectContaining({ id: 's', items: [] })]);
    expect(copy.waypoints).toEqual([]);
  });

  it('deletes every table of data, and the export is then empty', async () => {
    const db = await filled();
    const data = createLocalDataRepository(db);
    await data.deleteAll();
    for (const table of LocalSchema.DATA_TABLES) {
      expect(await db.all(`SELECT * FROM ${table}`)).toEqual([]);
    }
    expect((await data.exportAll()).settings).toBeNull();
  });
});
