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

describe('restoring from an export', () => {
  const blank = async () => createLocalDataRepository(await createMigratedSqlJsDb());

  it('puts back exactly what was exported, onto an empty phone', async () => {
    const source = createLocalDataRepository(await filled());
    const copy = await source.exportAll();
    const target = await blank();
    expect(await target.importAll!(copy)).toBe(3);
    expect({ ...(await target.exportAll()), exportedAt: copy.exportedAt }).toEqual(copy);
  });

  it('keeps what is already here, and adds nothing twice', async () => {
    const db = await filled();
    const data = createLocalDataRepository(db);
    const copy = await data.exportAll();
    await createLocalWeightRepository(db).update('w', 175);
    expect(await data.importAll!(copy)).toBe(0);
    expect((await data.exportAll()).weight).toEqual([
      expect.objectContaining({ id: 'w', lb: 175 }),
    ]);
  });

  it("reads an account's export: string numbers, other time formats, extra columns", async () => {
    const data = await blank();
    const added = await data.importAll!({
      exportedAt: '2026-10-20T08:00:00.000Z',
      weightUnit: 'lb',
      settings: { stepGoal: 9000 },
      food: [
        {
          id: 'f',
          user_id: 'u1',
          logged_on: '2026-10-18',
          meal: 'lunch',
          name: 'Soup',
          brand: null,
          servings: '1.50',
          serving_label: '1 bowl',
          calories: '210.0',
          protein: 9,
          carbs: 30,
          fat: 5,
          tier: 2,
          tier_overridden: true,
          measure: null,
          created_at: '2026-10-18T12:01:02.345+00:00',
        },
      ],
      weight: [{ id: 'w', user_id: 'u1', lb: '180.4', logged_at: '2026-10-18T07:00:00+00:00' }],
      waypoints: [{ user_id: 'u1', source: 'steps', day: '2026-10-18', points: 40 }],
      restDays: [],
      savedMeals: [],
      medicationDoses: [],
      waterEntries: [],
      moodCheckins: [{ user_id: 'u1', day: '2026-10-18', mood: 4, stress: 2 }],
      mealCheckins: [],
      skippedMeals: [],
      skippedWeighIns: [],
      movementEntries: [],
    });
    expect(added).toBe(4);
    const copy = await data.exportAll();
    expect(copy.settings).toEqual({ stepGoal: 9000 });
    expect(copy.weight).toEqual([
      { id: 'w', lb: 180.4, logged_at: '2026-10-18T07:00:00.000Z' },
    ]);
    expect(copy.food).toEqual([
      expect.objectContaining({
        servings: 1.5,
        calories: 210,
        tier_overridden: true,
        created_at: '2026-10-18T12:01:02.345Z',
      }),
    ]);
  });

  it('skips a row that is missing what its table needs, and keeps the rest', async () => {
    const data = await blank();
    const copy = await (await blank()).exportAll();
    expect(
      await data.importAll!({
        ...copy,
        weight: [
          { id: 'a', lb: 'heavy', logged_at: '2026-10-18T07:00:00.000Z' },
          { id: 'b', lb: 180, logged_at: 'not a time' },
          { lb: 180, logged_at: '2026-10-18T07:00:00.000Z' },
          'not a row',
          { id: 'ok', lb: 180, logged_at: '2026-10-18T07:00:00.000Z' },
        ],
      }),
    ).toBe(1);
  });
});
