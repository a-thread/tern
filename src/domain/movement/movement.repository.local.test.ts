import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import {
  Activity,
  Effort,
  type MovementEntry,
  MovementSource,
} from './models/movementEntry';
import { createLocalMovementRepository } from './movement.repository.local';
import {
  createMemoryMovementRepository,
  type MovementRepository,
} from './movement.repository';

const swim: MovementEntry = {
  id: 'a',
  day: '2026-10-18',
  activity: Activity.Swim,
  minutes: 40,
  effort: Effort.Moderate,
  distanceM: 1500,
  source: MovementSource.Manual,
  loggedAt: '2026-10-18T18:00:00.000Z',
};

const yoga: MovementEntry = {
  ...swim,
  id: 'b',
  activity: Activity.Yoga,
  minutes: 20,
  effort: null,
  distanceM: null,
  loggedAt: '2026-10-18T07:00:00.000Z',
};

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<MovementRepository>]>([
  ['memory', async () => createMemoryMovementRepository()],
  ['local', async () => createLocalMovementRepository(await createMigratedSqlJsDb())],
])('%s movement repository', (_name, create) => {
  it('loads entries in a range, oldest first, with effort and distance kept', async () => {
    const repo = await create();
    await repo.add(swim);
    await repo.add(yoga);
    await repo.add({ ...swim, id: 'c', day: '2026-10-25' });
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([yoga, swim]);
  });

  it('removes an entry', async () => {
    const repo = await create();
    await repo.add(swim);
    await repo.remove('a');
    expect(await repo.load('2026-10-18', '2026-10-18')).toEqual([]);
  });
});
