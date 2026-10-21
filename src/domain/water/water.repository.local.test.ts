import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { createLocalWaterRepository } from './water.repository.local';
import {
  createMemoryWaterRepository,
  type WaterRepository,
} from './water.repository';

const drink = (id: string, loggedOn: string, time = '08:00') => ({
  id,
  oz: 8,
  loggedOn,
  loggedAt: `${loggedOn}T${time}:00.000Z`,
});

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<WaterRepository>]>([
  ['memory', async () => createMemoryWaterRepository()],
  ['local', async () => createLocalWaterRepository(await createMigratedSqlJsDb())],
])('%s water repository', (_name, create) => {
  it('loads the drinks in a range, oldest first', async () => {
    const repo = await create();
    await repo.add(drink('a', '2026-10-18', '08:00'));
    await repo.add(drink('b', '2026-10-18', '12:30'));
    await repo.add(drink('c', '2026-10-20'));
    expect(await repo.load('2026-10-18', '2026-10-19')).toEqual([
      drink('a', '2026-10-18', '08:00'),
      drink('b', '2026-10-18', '12:30'),
    ]);
  });

  it('removes a drink', async () => {
    const repo = await create();
    await repo.add(drink('a', '2026-10-18'));
    await repo.remove('a');
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([]);
  });
});
