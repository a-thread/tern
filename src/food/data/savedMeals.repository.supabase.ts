import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import type { SavedMeal, SavedMealItem } from '@food/models/savedMeals';
import { parseMeasure } from '@food/models/measure';
import type { SavedMealsRepository } from './savedMeals.repository';

type Row = {
  id: string;
  name: string;
  items: SavedMealItem[];
  created_at: string;
};

export function createSupabaseSavedMealsRepository(
  db: TernClient,
): SavedMealsRepository {
  return {
    async list() {
      return (
        await rows<Row>(
          db
            .from('saved_meals')
            .select('id, name, items, created_at')
            .order('name'),
        )
      ).map((r) => ({
        id: r.id,
        name: r.name,
        // Items are stored as json, so a measure is checked on the way back in.
        items: r.items.map((i) => ({ ...i, measure: parseMeasure(i.measure) })),
        createdAt: r.created_at,
      }));
    },
    async save(meal: SavedMeal) {
      // user_id defaults to auth.uid() on insert; the id is chosen by the client.
      await ok(
        db
          .from('saved_meals')
          .upsert(
            {
              id: meal.id,
              name: meal.name,
              items: meal.items,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
          ),
      );
    },
    async remove(id) {
      await ok(db.from('saved_meals').delete().eq('id', id));
    },
  };
}
