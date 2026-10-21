import { migrateLocalDb } from '@shared/backend/localDb';
import { createSqlJsDb } from '@shared/backend/localDb.sqljs';
import { createLocalWeightRepository } from './weight.repository.local';
import {
  createMemoryWeightRepository,
  type WeightRepository,
} from './weight.repository';

async function local(): Promise<WeightRepository> {
  const db = await createSqlJsDb();
  await migrateLocalDb(db);
  return createLocalWeightRepository(db);
}

const memory = async (): Promise<WeightRepository> =>
  createMemoryWeightRepository([]);

// The local repository has to behave like the memory one the Contexts are tested against.
describe.each([
  ['memory', memory],
  ['local', local],
])('%s weight repository', (_name, create) => {
  it('loads weigh-ins newest first', async () => {
    const repo = await create();
    await repo.add({ id: 'a', lb: 180.4, loggedAt: '2026-10-18T07:00:00.000Z' });
    await repo.add({ id: 'b', lb: 179.8, loggedAt: '2026-10-19T07:05:00.000Z' });
    expect(await repo.load()).toEqual([
      { id: 'b', lb: 179.8, loggedAt: '2026-10-19T07:05:00.000Z' },
      { id: 'a', lb: 180.4, loggedAt: '2026-10-18T07:00:00.000Z' },
    ]);
  });

  it('corrects a weight and keeps when it was logged', async () => {
    const repo = await create();
    await repo.add({ id: 'a', lb: 180.4, loggedAt: '2026-10-18T07:00:00.000Z' });
    await repo.update('a', 178.2);
    expect(await repo.load()).toEqual([
      { id: 'a', lb: 178.2, loggedAt: '2026-10-18T07:00:00.000Z' },
    ]);
  });

  it('marks and unmarks a skipped day, and marking twice is harmless', async () => {
    const repo = await create();
    await repo.setSkipped('2026-10-18', true);
    await repo.setSkipped('2026-10-18', true);
    await repo.setSkipped('2026-10-19', true);
    expect((await repo.loadSkipped()).sort()).toEqual(['2026-10-18', '2026-10-19']);
    await repo.setSkipped('2026-10-18', false);
    expect(await repo.loadSkipped()).toEqual(['2026-10-19']);
  });
});

describe('local weight repository', () => {
  it('keeps what was written when the repository is created again over the same database', async () => {
    const db = await createSqlJsDb();
    await migrateLocalDb(db);
    await createLocalWeightRepository(db).add({
      id: 'a',
      lb: 180.4,
      loggedAt: '2026-10-18T07:00:00.000Z',
    });
    expect(await createLocalWeightRepository(db).load()).toHaveLength(1);
  });

  it('loads the newest 180, like the Supabase version', async () => {
    const repo = await local();
    for (let i = 0; i < 185; i++) {
      const day = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString();
      await repo.add({ id: String(i), lb: 180, loggedAt: day });
    }
    const loaded = await repo.load();
    expect(loaded).toHaveLength(180);
    expect(loaded[0].id).toBe('184');
  });
});
