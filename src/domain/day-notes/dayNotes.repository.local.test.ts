import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { createLocalDayNotesRepository } from './dayNotes.repository.local';
import {
  createMemoryDayNotesRepository,
  type DayNotesRepository,
} from './dayNotes.repository';

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<DayNotesRepository>]>([
  ['memory', async () => createMemoryDayNotesRepository()],
  [
    'local',
    async () => createLocalDayNotesRepository(await createMigratedSqlJsDb()),
  ],
])('%s day notes repository', (_name, create) => {
  it('loads notes in a range, oldest first', async () => {
    const repo = await create();
    await repo.save({ day: '2026-10-19', text: 'Joint pain' });
    await repo.save({ day: '2026-10-18', text: 'Low energy' });
    await repo.save({ day: '2026-10-25', text: 'Slept well' });
    expect(await repo.load('2026-10-18', '2026-10-20')).toEqual([
      { day: '2026-10-18', text: 'Low energy' },
      { day: '2026-10-19', text: 'Joint pain' },
    ]);
  });

  it('replaces the day on writing again, and removes it', async () => {
    const repo = await create();
    await repo.save({ day: '2026-10-18', text: 'Low energy' });
    await repo.save({ day: '2026-10-18', text: 'Took ibuprofen' });
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([
      { day: '2026-10-18', text: 'Took ibuprofen' },
    ]);
    await repo.remove('2026-10-18');
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([]);
  });
});
