import type { LocalDb } from '@shared/backend/localDb';
import { LocalSchema } from '@shared/backend/localSchema';
import type { AppSettings } from './models/appSettings';
import type { SettingsRepository } from './settings.repository';

/** Settings as one JSON document, like the Supabase `settings.data` column. */
export function createLocalSettingsRepository(db: LocalDb): SettingsRepository {
  return {
    async load() {
      const [row] = await db.all<{ data: string }>(
        'SELECT data FROM settings WHERE id = 1',
      );
      return row ? (JSON.parse(row.data) as Partial<AppSettings>) : null;
    },
    async save(settings) {
      await db.run(
        'INSERT OR REPLACE INTO settings (id, data, updated_at) VALUES (1, ?, ?)',
        [JSON.stringify(settings), new Date().toISOString()],
      );
    },
    async hasLoggedAnything() {
      for (const table of LocalSchema.DATA_TABLES) {
        if (table === 'settings') continue;
        const found = await db.all(`SELECT 1 FROM ${table} LIMIT 1`);
        if (found.length > 0) return true;
      }
      return false;
    },
  };
}
