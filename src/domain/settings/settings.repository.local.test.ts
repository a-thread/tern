import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import type { AppSettings } from './models/appSettings';
import { createLocalSettingsRepository } from './settings.repository.local';
import {
  createMemorySettingsRepository,
  type SettingsRepository,
} from './settings.repository';

// The repository stores the document whole; its fields don't matter here.
const settings = (stepGoal: number) =>
  ({ stepGoal, showCalories: false }) as unknown as AppSettings;

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<SettingsRepository>]>([
  ['memory', async () => createMemorySettingsRepository()],
  [
    'local',
    async () => createLocalSettingsRepository(await createMigratedSqlJsDb()),
  ],
])('%s settings repository', (_name, create) => {
  it('has nothing saved at first', async () => {
    expect(await (await create()).load()).toBeNull();
  });

  it('loads what was saved last', async () => {
    const repo = await create();
    await repo.save(settings(8000));
    await repo.save(settings(9000));
    expect(await repo.load()).toEqual(settings(9000));
  });
});

describe('local settings repository, logged data', () => {
  it('has nothing logged on a new install, even once settings are saved', async () => {
    const repo = createLocalSettingsRepository(await createMigratedSqlJsDb());
    await repo.save(settings(8000));
    expect(await repo.hasLoggedAnything()).toBe(false);
  });

  it('finds a row logged in any table', async () => {
    const db = await createMigratedSqlJsDb();
    await db.run("INSERT INTO rest_days (day) VALUES ('2026-10-01')");
    expect(await createLocalSettingsRepository(db).hasLoggedAnything()).toBe(
      true,
    );
  });
});
