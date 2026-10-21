import { LocalSchema } from './localSchema';

/** A value SQLite can bind to a `?` placeholder. */
export type SqlValue = string | number | null;

/**
 * The little of SQLite the local repositories use. Small on purpose, so they test against
 * an in-process SQLite (`createSqlJsDb`) without the native module; `openLocalDb` is the
 * phone's.
 */
export interface LocalDb {
  /** Runs one or more statements with no parameters (schema changes). */
  exec(sql: string): Promise<void>;
  /** Runs one write (insert, update, delete). */
  run(sql: string, params?: SqlValue[]): Promise<void>;
  /** Runs a select and returns its rows. A query that matched nothing gives `[]`. */
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
}

/**
 * Brings the database up to the newest schema. Each migration runs once, in order, and
 * `user_version` records how many have run, so opening an up-to-date database does nothing.
 */
export async function migrateLocalDb(
  db: LocalDb,
  migrations: readonly string[] = LocalSchema.MIGRATIONS,
): Promise<void> {
  const [{ user_version: version }] = await db.all<{ user_version: number }>(
    'PRAGMA user_version',
  );
  for (let v = version; v < migrations.length; v++) {
    // One transaction per step: a migration that fails leaves the version where it was.
    try {
      await db.exec(
        `BEGIN; ${migrations[v]}; PRAGMA user_version = ${v + 1}; COMMIT;`,
      );
    } catch (error) {
      await db.exec('ROLLBACK').catch(() => {});
      throw error;
    }
  }
}
