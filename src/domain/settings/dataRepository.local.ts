import type { LocalDb, SqlValue } from '@shared/backend/localDb';
import { LocalSchema } from '@shared/backend/localSchema';
import { LocalMetaKey, setLocalMeta } from '@shared/backend/localMeta';
import type { DataRepository } from './dataRepository';
import {
  EXPORT_LISTS,
  type TernExport,
} from './models/ternExport';

type Row = Record<string, unknown>;

/** How one export list goes back into its table. */
type TableImport = {
  table: string;
  columns: string[];
  /** Numbers, which an account's export may hold as strings ("1.50"). */
  numbers?: string[];
  /** Times, rewritten as ISO so they sort with the ones logged here. */
  times?: string[];
  /** Values stored as JSON text. */
  json?: string[];
  /** True or false, stored as 1 or 0. */
  flags?: string[];
  /** Filled in when the file has nothing: an older export, or one from an account. */
  defaults?: Record<string, () => SqlValue>;
};

const now = () => new Date().toISOString();

const IMPORTS: Record<(typeof EXPORT_LISTS)[number], TableImport> = {
  food: {
    table: 'food_entries',
    columns: [
      'id',
      'logged_on',
      'meal',
      'name',
      'brand',
      'servings',
      'serving_label',
      'calories',
      'protein',
      'carbs',
      'fat',
      'tier',
      'tier_overridden',
      'measure',
      'created_at',
    ],
    numbers: ['servings', 'calories', 'protein', 'carbs', 'fat', 'tier'],
    times: ['created_at'],
    json: ['measure'],
    flags: ['tier_overridden'],
    defaults: { created_at: now, tier_overridden: () => 0 },
  },
  weight: {
    table: 'weight_entries',
    columns: ['id', 'lb', 'logged_at'],
    numbers: ['lb'],
    times: ['logged_at'],
  },
  waypoints: {
    table: 'waypoint_events',
    columns: ['source', 'day', 'points'],
    numbers: ['points'],
  },
  restDays: { table: 'rest_days', columns: ['day'] },
  savedMeals: {
    table: 'saved_meals',
    columns: ['id', 'name', 'items', 'created_at', 'updated_at'],
    times: ['created_at', 'updated_at'],
    json: ['items'],
    defaults: { created_at: now, updated_at: now },
  },
  medicationDoses: {
    table: 'medication_doses',
    columns: ['medication_id', 'day'],
  },
  waterEntries: {
    table: 'water_entries',
    columns: ['id', 'oz', 'logged_on', 'logged_at'],
    numbers: ['oz'],
    times: ['logged_at'],
  },
  moodCheckins: {
    table: 'mood_checkins',
    columns: ['day', 'mood', 'stress', 'updated_at'],
    numbers: ['mood', 'stress'],
    times: ['updated_at'],
    defaults: { updated_at: now },
  },
  mealCheckins: {
    table: 'meal_checkins',
    columns: ['day', 'meal', 'fullness', 'feeling', 'note', 'updated_at'],
    numbers: ['fullness', 'feeling'],
    times: ['updated_at'],
    defaults: { updated_at: now },
  },
  skippedMeals: { table: 'skipped_meals', columns: ['day', 'meal'] },
  skippedWeighIns: { table: 'skipped_weigh_ins', columns: ['day'] },
  movementEntries: {
    table: 'movement_entries',
    columns: [
      'id',
      'day',
      'activity',
      'minutes',
      'effort',
      'distance_m',
      'logged_at',
    ],
    numbers: ['minutes', 'distance_m'],
    times: ['logged_at'],
  },
};

/** One value from a file as the column stores it; null for anything that doesn't fit. */
function toColumn(spec: TableImport, column: string, value: unknown): SqlValue {
  if (value === undefined || value === null) {
    return spec.defaults?.[column]?.() ?? null;
  }
  if (spec.json?.includes(column)) return JSON.stringify(value);
  if (spec.flags?.includes(column)) return value === true || value === 1 ? 1 : 0;
  if (spec.numbers?.includes(column)) {
    const n = Number(value);
    return typeof value !== 'boolean' && value !== '' && Number.isFinite(n) ? n : null;
  }
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (spec.times?.includes(column)) {
    const t = new Date(value);
    return Number.isNaN(t.getTime()) ? null : t.toISOString();
  }
  return value;
}

/** Runs `work` in one transaction: it all lands, or none of it does. */
async function inTransaction(db: LocalDb, work: () => Promise<void>) {
  await db.exec('BEGIN');
  try {
    await work();
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK').catch(() => {});
    throw error;
  }
}

/** Export, erase and restore for the on-device database. The export has the same shape as an account's. */
export function createLocalDataRepository(db: LocalDb): DataRepository {
  const all = (table: string) => db.all<Row>(`SELECT * FROM ${table}`);
  // Entries only: settings are one document, replaced rather than added.
  const rowCount = async () => {
    let n = 0;
    for (const { table } of Object.values(IMPORTS)) {
      const [{ count }] = await db.all<{ count: number }>(
        `SELECT COUNT(*) AS count FROM ${table}`,
      );
      n += count;
    }
    return n;
  };

  const deleteAll = () =>
    inTransaction(db, async () => {
      for (const table of LocalSchema.DATA_TABLES) {
        await db.run(`DELETE FROM ${table}`);
      }
      // The account log copied down is gone with the rest, so the phone no longer holds
      // anyone else's: what's logged from here can go into whichever account signs in.
      await setLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT, null);
    });

  return {
    async exportAll(): Promise<TernExport> {
      const [settings] = await db.all<{ data: string }>(
        'SELECT data FROM settings WHERE id = 1',
      );
      // Saved meal items and food measures are JSON text here; the export holds them as values.
      const savedMeals = (await all('saved_meals')).map((r) => ({
        ...r,
        items: JSON.parse(r.items as string),
      }));
      const food = (await all('food_entries')).map((r) => ({
        ...r,
        tier_overridden: r.tier_overridden === 1,
        measure: r.measure === null ? null : JSON.parse(r.measure as string),
      }));
      return {
        exportedAt: new Date().toISOString(),
        weightUnit: 'lb',
        settings: settings ? JSON.parse(settings.data) : null,
        food,
        weight: await all('weight_entries'),
        waypoints: await all('waypoint_events'),
        restDays: await all('rest_days'),
        savedMeals,
        medicationDoses: await all('medication_doses'),
        waterEntries: await all('water_entries'),
        moodCheckins: await all('mood_checkins'),
        mealCheckins: await all('meal_checkins'),
        skippedMeals: await all('skipped_meals'),
        skippedWeighIns: await all('skipped_weigh_ins'),
        movementEntries: await all('movement_entries'),
      };
    },

    deleteAll,
    // There is no account on the phone: deleting it is deleting what it holds.
    deleteAccount: deleteAll,

    async importAll(copy) {
      const before = await rowCount();
      await inTransaction(db, async () => {
        for (const list of EXPORT_LISTS) {
          const spec = IMPORTS[list];
          const sql = `INSERT OR IGNORE INTO ${spec.table} (${spec.columns.join(', ')})
                       VALUES (${spec.columns.map(() => '?').join(', ')})`;
          for (const item of copy[list]) {
            if (!item || typeof item !== 'object') continue;
            const row = item as Row;
            // OR IGNORE: a row already here, or one missing what its table requires, is skipped.
            await db.run(
              sql,
              spec.columns.map((c) => toColumn(spec, c, row[c])),
            );
          }
        }
        if (copy.settings && typeof copy.settings === 'object') {
          await db.run(
            'INSERT OR REPLACE INTO settings (id, data, updated_at) VALUES (1, ?, ?)',
            [JSON.stringify(copy.settings), now()],
          );
        }
      });
      return (await rowCount()) - before;
    },
  };
}
