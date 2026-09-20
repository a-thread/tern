import type { TernClient } from '@shared/backend/supabase';
import type { WaypointSource } from './models';
import type { WaypointsRepository } from './repository';

export function createSupabaseWaypointsRepository(
  db: TernClient,
): WaypointsRepository {
  return {
    async load(day) {
      const [totals, today] = await Promise.all([
        db.from('waypoint_totals').select('total').maybeSingle(),
        db.from('waypoint_events').select('source').eq('day', day),
      ]);
      if (totals.error) throw totals.error;
      if (today.error) throw today.error;
      return {
        total: Number(totals.data?.total ?? 0),
        todaySources: (today.data ?? []).map(
          (r: { source: WaypointSource }) => r.source,
        ),
      };
    },
    async history() {
      const { data, error } = await db
        .from('waypoint_events')
        .select('source, day, points')
        .order('day', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(
        (r: { source: WaypointSource; day: string; points: number }) => ({
          source: r.source,
          day: r.day,
          points: Number(r.points),
        }),
      );
    },
    async award(source, points, day) {
      // Unique (user, source, day): a repeat award is silently ignored.
      const { error } = await db
        .from('waypoint_events')
        .upsert(
          { source, points, day },
          { onConflict: 'user_id,source,day', ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    async revoke(source, day) {
      const { error } = await db
        .from('waypoint_events')
        .delete()
        .eq('source', source)
        .eq('day', day);
      if (error) throw error;
    },
  };
}
