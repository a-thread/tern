import type { TernClient } from '@/shared/backend/supabase';
import { ok, rows } from '@/shared/backend/query';
import type { WeightEntry } from '@/domain/weight/models/weightEntry';
import type { WeightRepository } from '@/domain/weight/weight.repository';

type WeightRow = { id: string; lb: number | string; logged_at: string };

export function rowToWeight(row: WeightRow): WeightEntry {
  return { id: row.id, lb: Number(row.lb), loggedAt: row.logged_at };
}

export function createSupabaseWeightRepository(
  db: TernClient,
): WeightRepository {
  return {
    async load() {
      return (
        await rows<WeightRow>(
          db
            .from('weight_entries')
            .select('id, lb, logged_at')
            .order('logged_at', { ascending: false })
            .limit(180),
        )
      ).map(rowToWeight);
    },
    async add(entry) {
      await ok(
        db
          .from('weight_entries')
          .insert({ id: entry.id, lb: entry.lb, logged_at: entry.loggedAt }),
      );
    },
    async update(id, lb) {
      await ok(db.from('weight_entries').update({ lb }).eq('id', id));
    },
  };
}
