import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { WaypointSource } from './models/waypoint';
import { createLocalWaypointsRepository } from './waypoints.repository.local';
import {
  createMemoryWaypointsRepository,
  type WaypointsRepository,
} from './waypoints.repository';

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each<[string, () => Promise<WaypointsRepository>]>([
  // No seeded history, so both start from an empty ledger.
  ['memory', async () => createMemoryWaypointsRepository(0, [])],
  ['local', async () => createLocalWaypointsRepository(await createMigratedSqlJsDb())],
])('%s waypoints repository', (_name, create) => {
  it('starts with an empty ledger', async () => {
    expect(await (await create()).load('2026-10-18')).toEqual({
      total: 0,
      todaySources: [],
    });
  });

  it('awards a source once per day, and totals every day', async () => {
    const repo = await create();
    // The app loads before it awards; the memory version seeds itself on that first load.
    await repo.load('2026-10-18');
    await repo.award(WaypointSource.Steps, 40, '2026-10-17');
    await repo.award(WaypointSource.Steps, 40, '2026-10-18');
    await repo.award(WaypointSource.Steps, 40, '2026-10-18');
    await repo.award(WaypointSource.Water, 10, '2026-10-18');
    const { total, todaySources } = await repo.load('2026-10-18');
    expect(total).toBe(90);
    expect(todaySources.sort()).toEqual([
      WaypointSource.Steps,
      WaypointSource.Water,
    ]);
    expect(await repo.history()).toHaveLength(3);
  });

  it('takes an award back', async () => {
    const repo = await create();
    await repo.load('2026-10-18');
    await repo.award(WaypointSource.Water, 10, '2026-10-18');
    await repo.revoke(WaypointSource.Water, '2026-10-18');
    expect(await repo.load('2026-10-18')).toEqual({ total: 0, todaySources: [] });
    expect(await repo.history()).toEqual([]);
  });
});
