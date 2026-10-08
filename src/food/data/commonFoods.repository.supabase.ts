import type { TernClient } from '@shared/backend/supabase';
import type { Portion } from '@food/data/sources/searchResult';
import type { CommonFood } from '@food/models/commonFoods';
import type { Tier } from '@food/models/foodEntry';
import type { CommonFoodsRepository } from './commonFoods.repository';

type Row = {
  id: string;
  name: string;
  detail: string | null;
  aliases: string[] | null;
  kcal: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  portions: Portion[] | null;
  rank: number;
  tier: number | null;
};

// PostgREST returns at most 1,000 rows per request.
const PAGE = 1000;

export function rowToCommonFood(r: Row): CommonFood {
  return {
    id: r.id,
    name: r.name,
    ...(r.detail ? { detail: r.detail } : {}),
    ...(r.aliases?.length ? { aliases: r.aliases } : {}),
    kcal: Number(r.kcal),
    protein: Number(r.protein),
    carbs: Number(r.carbs),
    fat: Number(r.fat),
    ...(r.portions?.length ? { portions: r.portions } : {}),
    rank: r.rank,
    tier: r.tier !== null && [1, 2, 3, 4].includes(r.tier) ? (r.tier as Tier) : null,
  };
}

export function createSupabaseCommonFoodsRepository(db: TernClient): CommonFoodsRepository {
  return {
    async version() {
      const { data, error } = await db.from('common_foods_meta').select('version').maybeSingle();
      if (error) throw error;
      return (data as { version: string } | null)?.version ?? null;
    },
    async loadAll() {
      const out: CommonFood[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db
          .from('common_foods')
          .select('id, name, detail, aliases, kcal, protein, carbs, fat, portions, rank, tier')
          .order('rank')
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const rows = (data ?? []) as Row[];
        out.push(...rows.map(rowToCommonFood));
        if (rows.length < PAGE) return out;
      }
    },
  };
}
