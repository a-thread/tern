import type { TernClient } from '@shared/backend/supabase';
import type { RestDaysRepository } from './restDays.repository';

export function createSupabaseRestDaysRepository(
  db: TernClient,
): RestDaysRepository {
  return {
    async load(from, to) {
      const { data, error } = await db
        .from('rest_days')
        .select('day')
        .gte('day', from)
        .lte('day', to);
      if (error) throw error;
      return (data ?? []).map((r: { day: string }) => r.day);
    },
    async add(day) {
      const { error } = await db
        .from('rest_days')
        .upsert({ day }, { onConflict: 'user_id,day', ignoreDuplicates: true });
      if (error) throw error;
    },
    async remove(day) {
      const { error } = await db.from('rest_days').delete().eq('day', day);
      if (error) throw error;
    },
  };
}
