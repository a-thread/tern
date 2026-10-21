import type { LocalDb } from '@shared/backend/localDb';
import { LocalSchema } from '@shared/backend/localSchema';
import type { DataRepository, TernExport } from './dataRepository';

type Row = Record<string, unknown>;

/** Export and erase for the on-device database. The export has the same shape as an account's. */
export function createLocalDataRepository(db: LocalDb): DataRepository {
  const all = (table: string) => db.all<Row>(`SELECT * FROM ${table}`);

  // All or nothing: a failure part way leaves every table as it was.
  const deleteAll = async () => {
    try {
      await db.exec(
        `BEGIN; ${LocalSchema.DATA_TABLES.map((t) => `DELETE FROM ${t}`).join('; ')}; COMMIT;`,
      );
    } catch (error) {
      await db.exec('ROLLBACK').catch(() => {});
      throw error;
    }
  };

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
  };
}
