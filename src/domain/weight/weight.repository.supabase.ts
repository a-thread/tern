import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import type { WeightEntry } from './models/weightEntry';
import type { WeightRepository } from './weight.repository';

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
    async loadSkipped() {
      const data = await rows<{ day: string }>(
        db
          .from('skipped_weigh_ins')
          .select('day')
          .order('day', { ascending: false })
          .limit(30),
      );
      return data.map((r) => r.day);
    },
    async setSkipped(day, skipped) {
      // Primary key (user, day): marking twice is harmless.
      await ok(
        skipped
          ? db
              .from('skipped_weigh_ins')
              .upsert({ day }, { onConflict: 'user_id,day', ignoreDuplicates: true })
          : db.from('skipped_weigh_ins').delete().eq('day', day),
      );
    },
  };
}
