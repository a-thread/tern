import * as SQLite from 'expo-sqlite';
import { migrateLocalDb, type LocalDb } from './localDb';
import { LocalSchema } from './localSchema';

let opening: Promise<LocalDb> | null = null;

/** One file so Auto Backup carries it. Opened once per launch; a failed open is retried next call. */
export function openLocalDb(): Promise<LocalDb> {
  opening ??= open().catch((error) => {
    opening = null;
    throw error;
  });
  return opening;
}

async function open(): Promise<LocalDb> {
  const native = await SQLite.openDatabaseAsync(LocalSchema.FILE_NAME);
  const db: LocalDb = {
    exec: (sql) => native.execAsync(sql),
    run: async (sql, params = []) => {
      await native.runAsync(sql, params);
    },
    all: (sql, params = []) => native.getAllAsync(sql, params),
  };
  await migrateLocalDb(db);
  return db;
}
