import type { LocalDb } from '@shared/backend/localDb';
import type { SavedMealItem } from './models/savedMeals';
import { parseMeasure } from '../food/models/measure';
import type { SavedMealsRepository } from './savedMeals.repository';

type Row = { id: string; name: string; items: string; created_at: string };

export function createLocalSavedMealsRepository(
  db: LocalDb,
): SavedMealsRepository {
  return {
    async list() {
      return (
        await db.all<Row>(
          'SELECT id, name, items, created_at FROM saved_meals ORDER BY name',
        )
      ).map((r) => ({
        id: r.id,
        name: r.name,
        // Items are stored as json, so a measure is checked on the way back in.
        items: (JSON.parse(r.items) as SavedMealItem[]).map((i) => ({
          ...i,
          measure: parseMeasure(i.measure),
        })),
        createdAt: r.created_at,
      }));
    },
    async save(meal) {
      // Inserts or updates by id; an update keeps when the meal was first saved.
      await db.run(
        `INSERT INTO saved_meals (id, name, items, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           name = excluded.name, items = excluded.items, updated_at = excluded.updated_at`,
        [
          meal.id,
          meal.name,
          JSON.stringify(meal.items),
          meal.createdAt,
          new Date().toISOString(),
        ],
      );
    },
    async remove(id) {
      await db.run('DELETE FROM saved_meals WHERE id = ?', [id]);
    },
  };
}
