import type { TernClient } from '@/shared/backend/supabase';
import { ok, rows } from '@/shared/backend/query';
import type { FoodEntry, Tier } from '@/domain/food/models/foodEntry';
import { parseMeasure } from '@/domain/food/models/measure';
import type { FoodRepository, NewFoodEntry } from '@/domain/food/food.repository';

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
  measure?: unknown;
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
    measure: parseMeasure(row.measure),
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
  if (patch.measure !== undefined) row.measure = patch.measure;
  return row;
}

export function createSupabaseFoodRepository(db: TernClient): FoodRepository {
  return {
    async load(day) {
      const data = await rows<FoodRow>(
        db
          .from('food_entries')
          .select('*')
          .eq('logged_on', day)
          .order('created_at'),
      );
      return data.map(rowToFood);
    },
    async history(from, to) {
      const data = await rows<FoodRow>(
        db
          .from('food_entries')
          .select('*')
          .gte('logged_on', from)
          .lte('logged_on', to)
          .order('logged_on')
          .order('created_at'),
      );
      const byDay: Record<string, FoodEntry[]> = {};
      for (const row of data) {
        (byDay[row.logged_on] ??= []).push(rowToFood(row));
      }
      return byDay;
    },
    async add(day, entry) {
      const { id, ...rest } = entry;
      await ok(
        db
          .from('food_entries')
          .insert({ id, logged_on: day, ...patchToRow(rest) }),
      );
    },
    async update(id, patch) {
      await ok(db.from('food_entries').update(patchToRow(patch)).eq('id', id));
    },
    async remove(id) {
      await ok(db.from('food_entries').delete().eq('id', id));
    },
    async loadSkipped(day) {
      const data = await rows<{ meal: FoodEntry['meal'] }>(
        db.from('skipped_meals').select('meal').eq('day', day),
      );
      return data.map((r) => r.meal);
    },
    async skippedHistory(from, to) {
      const data = await rows<{ day: string; meal: FoodEntry['meal'] }>(
        db
          .from('skipped_meals')
          .select('day, meal')
          .gte('day', from)
          .lte('day', to),
      );
      const out: Record<string, FoodEntry['meal'][]> = {};
      for (const r of data) {
        (out[r.day] ??= []).push(r.meal);
      }
      return out;
    },
    async setSkipped(day, meal, skipped) {
      // Primary key (user, day, meal): marking twice is harmless.
      await ok(
        skipped
          ? db
              .from('skipped_meals')
              .upsert(
                { day, meal },
                { onConflict: 'user_id,day,meal', ignoreDuplicates: true },
              )
          : db.from('skipped_meals').delete().eq('day', day).eq('meal', meal),
      );
    },
  };
}
