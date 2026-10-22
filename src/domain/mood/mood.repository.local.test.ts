import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { createLocalMoodRepository } from './mood.repository.local';
import {
  createMemoryMoodRepository,
  type MoodRepository,
} from './mood.repository';

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<MoodRepository>]>([
  ['memory', async () => createMemoryMoodRepository()],
  ['local', async () => createLocalMoodRepository(await createMigratedSqlJsDb())],
])('%s mood repository', (_name, create) => {
  it('loads check-ins in a range, oldest first', async () => {
    const repo = await create();
    await repo.save({ day: '2026-10-19', mood: 4, stress: 2 });
    await repo.save({ day: '2026-10-18', mood: 3, stress: 3 });
    await repo.save({ day: '2026-10-25', mood: 5, stress: 1 });
    expect(await repo.load('2026-10-18', '2026-10-20')).toEqual([
      { day: '2026-10-18', mood: 3, stress: 3 },
      { day: '2026-10-19', mood: 4, stress: 2 },
    ]);
  });

  it('replaces the day on checking in again, and removes it', async () => {
    const repo = await create();
    await repo.save({ day: '2026-10-18', mood: 3, stress: 3 });
    await repo.save({ day: '2026-10-18', mood: 5, stress: 1 });
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([
      { day: '2026-10-18', mood: 5, stress: 1 },
    ]);
    await repo.remove('2026-10-18');
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([]);
  });
});
