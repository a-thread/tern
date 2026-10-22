import { migrateLocalDb } from './localDb';
import { createSqlJsDb } from './localDb.sqljs';
import { LocalSchema } from './localSchema';

const version = async (db: Awaited<ReturnType<typeof createSqlJsDb>>) =>
  (await db.all<{ user_version: number }>('PRAGMA user_version'))[0].user_version;

describe('migrateLocalDb', () => {
  it('runs every migration on a new database', async () => {
    const db = await createSqlJsDb();
    await migrateLocalDb(db);
    expect(await version(db)).toBe(LocalSchema.MIGRATIONS.length);
  });

  it('does nothing on a database that is already up to date', async () => {
    const db = await createSqlJsDb();
    await migrateLocalDb(db);
    // Running the first migration again would fail: its tables already exist.
    await expect(migrateLocalDb(db)).resolves.toBeUndefined();
  });

  it('runs only the migrations a database has not had yet', async () => {
    const db = await createSqlJsDb();
    await migrateLocalDb(db, ['CREATE TABLE a (x)']);
    await migrateLocalDb(db, ['CREATE TABLE a (x)', 'CREATE TABLE b (x)']);
    expect(await version(db)).toBe(2);
    expect(await db.all('SELECT * FROM b')).toEqual([]);
  });

  it('leaves the version alone when a migration fails', async () => {
    const db = await createSqlJsDb();
    await expect(
      migrateLocalDb(db, ['CREATE TABLE a (x); NOT SQL']),
    ).rejects.toThrow();
    expect(await version(db)).toBe(0);
    expect(await db.all("SELECT name FROM sqlite_master WHERE name = 'a'")).toEqual([]);
  });
});
