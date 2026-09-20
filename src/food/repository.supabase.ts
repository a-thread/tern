import type { TernClient } from '@shared/backend/supabase';
import type { FoodEntry, Tier } from './models';
import type { FoodRepository, NewFoodEntry } from './repository';

type FoodRow = {
  id: string;
  logged_on: string;
  meal: FoodEntry['meal'];
  name: string;
  brand: string | null;
  servings: number | string;
  serving_label: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  tier: number;
  tier_overridden: boolean;
};

export function rowToFood(row: FoodRow): FoodEntry {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    meal: row.meal,
    servings: Number(row.servings),
    servingLabel: row.serving_label,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    tier: row.tier as Tier,
    tierOverridden: row.tier_overridden || undefined,
  };
}

/** Maps only the fields present in `patch`, so a partial update never clobbers the rest. */
export function patchToRow(patch: Partial<NewFoodEntry>) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.brand !== undefined) row.brand = patch.brand;
  if (patch.meal !== undefined) row.meal = patch.meal;
  if (patch.servings !== undefined) row.servings = patch.servings;
  if (patch.servingLabel !== undefined) row.serving_label = patch.servingLabel;
  if (patch.calories !== undefined) row.calories = patch.calories;
  if (patch.protein !== undefined) row.protein = patch.protein;
  if (patch.carbs !== undefined) row.carbs = patch.carbs;
  if (patch.fat !== undefined) row.fat = patch.fat;
  if (patch.tier !== undefined) row.tier = patch.tier;
  if (patch.tierOverridden !== undefined)
    row.tier_overridden = patch.tierOverridden;
  return row;
}

export function createSupabaseFoodRepository(db: TernClient): FoodRepository {
  return {
    async load(day) {
      const { data, error } = await db
        .from('food_entries')
        .select('*')
        .eq('logged_on', day)
        .order('created_at');
      if (error) throw error;
      return (data as FoodRow[]).map(rowToFood);
    },
    async history(from, to) {
      const { data, error } = await db
        .from('food_entries')
        .select('*')
        .gte('logged_on', from)
        .lte('logged_on', to)
        .order('logged_on');
      if (error) throw error;
      const byDay: Record<string, FoodEntry[]> = {};
      for (const row of data as FoodRow[]) {
        (byDay[row.logged_on] ??= []).push(rowToFood(row));
      }
      return byDay;
    },
    async add(day, entry) {
      const { id, ...rest } = entry;
      const { error } = await db
        .from('food_entries')
        .insert({ id, logged_on: day, ...patchToRow(rest) });
      if (error) throw error;
    },
    async update(id, patch) {
      const { error } = await db
        .from('food_entries')
        .update(patchToRow(patch))
        .eq('id', id);
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await db.from('food_entries').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
