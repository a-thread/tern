import type { TernClient } from '@/shared/backend/supabase';
import { ok, rows } from '@/shared/backend/query';
import type { RestDaysRepository } from '@/domain/activity/restDays.repository';

export function createSupabaseRestDaysRepository(
  db: TernClient,
): RestDaysRepository {
  return {
    async load(from, to) {
      return (
        await rows<{ day: string }>(
          db.from('rest_days').select('day').gte('day', from).lte('day', to),
        )
      ).map((r) => r.day);
    },
    async add(day) {
      await ok(
        db
          .from('rest_days')
          .upsert(
            { day },
            { onConflict: 'user_id,day', ignoreDuplicates: true },
          ),
      );
    },
    async remove(day) {
      await ok(db.from('rest_days').delete().eq('day', day));
    },
  };
}
