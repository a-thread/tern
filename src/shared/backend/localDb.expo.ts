import * as SQLite from 'expo-sqlite';
import { migrateLocalDb, type LocalDb } from './localDb';
import { LocalSchema } from './localSchema';

/** The on-device database, migrated and ready. One file, so Android Auto Backup can carry it to a new phone. */
export async function openLocalDb(): Promise<LocalDb> {
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
