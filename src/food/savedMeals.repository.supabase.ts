import type { TernClient } from '@shared/backend/supabase';
import type { SavedMeal, SavedMealItem } from './savedMeals';
import type { SavedMealsRepository } from './savedMeals.repository';

type Row = { id: string; name: string; items: SavedMealItem[]; created_at: string };

export function createSupabaseSavedMealsRepository(
  db: TernClient,
): SavedMealsRepository {
  return {
    async list() {
      const { data, error } = await db
        .from('saved_meals')
        .select('id, name, items, created_at')
        .order('name');
      if (error) throw error;
      return (data as Row[]).map((r) => ({
        id: r.id,
        name: r.name,
        items: r.items,
        createdAt: r.created_at,
      }));
    },
    async save(meal: SavedMeal) {
      // user_id defaults to auth.uid() on insert; the id is chosen by the client.
      const { error } = await db.from('saved_meals').upsert(
        {
          id: meal.id,
          name: meal.name,
          items: meal.items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await db.from('saved_meals').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
