import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { createLocalRestDaysRepository } from './restDays.repository.local';
import {
  createMemoryRestDaysRepository,
  type RestDaysRepository,
} from './restDays.repository';

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<RestDaysRepository>]>([
  ['memory', async () => createMemoryRestDaysRepository()],
  ['local', async () => createLocalRestDaysRepository(await createMigratedSqlJsDb())],
])('%s rest days repository', (_name, create) => {
  it('loads the rest days in a range, ends included', async () => {
    const repo = await create();
    for (const day of ['2026-10-01', '2026-10-05', '2026-10-09']) await repo.add(day);
    expect((await repo.load('2026-10-01', '2026-10-05')).sort()).toEqual([
      '2026-10-01',
      '2026-10-05',
    ]);
  });

  it('adds a day once however often it is added, and removes it', async () => {
    const repo = await create();
    await repo.add('2026-10-05');
    await repo.add('2026-10-05');
    expect(await repo.load('2026-10-01', '2026-10-31')).toEqual(['2026-10-05']);
    await repo.remove('2026-10-05');
    expect(await repo.load('2026-10-01', '2026-10-31')).toEqual([]);
  });
});
