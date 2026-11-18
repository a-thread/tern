import { LocalSchema } from './localSchema';

/** A value SQLite can bind to a `?` placeholder. */
export type SqlValue = string | number | null;

/** Small on purpose so repositories test against `createSqlJsDb` without the native module. */
export interface LocalDb {
  /** Runs one or more statements with no parameters (schema changes). */
  exec(sql: string): Promise<void>;
  /** Runs one write (insert, update, delete). */
  run(sql: string, params?: SqlValue[]): Promise<void>;
  /** Runs a select and returns its rows. A query that matched nothing gives `[]`. */
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
}

/** `user_version` counts migrations run, so each runs once. */
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
