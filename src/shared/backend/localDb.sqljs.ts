import initSqlJs from 'sql.js';
import { migrateLocalDb, type LocalDb } from './localDb';

/**
 * A `LocalDb` over sql.js, SQLite compiled to WebAssembly, for tests. Same SQL engine as
 * the phone, held in memory, so local repositories are tested against real queries.
 */
export async function createSqlJsDb(): Promise<LocalDb> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  return {
    exec: async (sql) => {
      db.exec(sql);
    },
    run: async (sql, params = []) => {
      db.run(sql, params);
    },
    all: async <T>(sql: string, params: (string | number | null)[] = []) => {
      const statement = db.prepare(sql, params);
      const out: T[] = [];
      while (statement.step()) out.push(statement.getAsObject() as T);
      statement.free();
      return out;
    },
  };
}

/** A fresh test database with the app's schema, as a phone has it after opening. */
export async function createMigratedSqlJsDb(): Promise<LocalDb> {
  const db = await createSqlJsDb();
  await migrateLocalDb(db);
  return db;
}
