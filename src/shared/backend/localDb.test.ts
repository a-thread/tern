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

  it('gives a phone that ran step 1 before it had the meta table one', async () => {
    const db = await createSqlJsDb();
    // Step 1 as an early build shipped it: everything but meta.
    const earlyStep1 = LocalSchema.MIGRATIONS[0].replace(/CREATE TABLE meta \([^;]*\);/, '');
    await migrateLocalDb(db, [earlyStep1]);
    expect(await db.all("SELECT name FROM sqlite_master WHERE name = 'meta'")).toEqual([]);

    await migrateLocalDb(db);
    expect(await version(db)).toBe(LocalSchema.MIGRATIONS.length);
    await db.run("INSERT INTO meta (key, value) VALUES ('k', 'v')");
    expect(await db.all('SELECT value FROM meta')).toEqual([{ value: 'v' }]);
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
