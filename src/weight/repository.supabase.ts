import type { TernClient } from '@shared/backend/supabase';
import type { WeightEntry } from './models';
import type { WeightRepository } from './repository';

type WeightRow = { id: string; lb: number | string; logged_at: string };

export function rowToWeight(row: WeightRow): WeightEntry {
  return { id: row.id, lb: Number(row.lb), loggedAt: row.logged_at };
}

export function createSupabaseWeightRepository(
  db: TernClient,
): WeightRepository {
  return {
    async load() {
      const { data, error } = await db
        .from('weight_entries')
        .select('id, lb, logged_at')
        .order('logged_at', { ascending: false })
        .limit(180);
      if (error) throw error;
      return (data as WeightRow[]).map(rowToWeight);
    },
    async add(entry) {
      const { error } = await db
        .from('weight_entries')
        .insert({ id: entry.id, lb: entry.lb, logged_at: entry.loggedAt });
      if (error) throw error;
    },
  };
}
