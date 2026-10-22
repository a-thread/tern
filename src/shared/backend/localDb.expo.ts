import * as SQLite from 'expo-sqlite';
import { migrateLocalDb, type LocalDb } from './localDb';
import { LocalSchema } from './localSchema';

let opening: Promise<LocalDb> | null = null;

/**
 * The on-device database, migrated and ready. One file, so Android Auto Backup can carry it
 * to a new phone. Opened once per launch: signing in and out reuses it. A failed open is
 * forgotten, so the next call tries again.
 */
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
