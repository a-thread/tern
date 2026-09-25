import type { TernClient } from '@shared/backend/supabase';
import type { MoodEntry } from './models';
import type { MoodRepository } from './repository';

type MoodRow = { day: string; mood: number; stress: number };

export const rowToMood = (row: MoodRow): MoodEntry => ({
  day: row.day,
  mood: Number(row.mood),
  stress: Number(row.stress),
});

export function createSupabaseMoodRepository(db: TernClient): MoodRepository {
  return {
    async load(from, to) {
      const { data, error } = await db
        .from('mood_checkins')
        .select('day, mood, stress')
        .gte('day', from)
        .lte('day', to)
        .order('day', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data as MoodRow[]).map(rowToMood);
    },
    async save(entry) {
      // One row per day: checking in again replaces it.
      const { error } = await db.from('mood_checkins').upsert(
        {
          day: entry.day,
          mood: entry.mood,
          stress: entry.stress,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day' },
      );
      if (error) throw error;
    },
    async remove(day) {
      const { error } = await db.from('mood_checkins').delete().eq('day', day);
      if (error) throw error;
    },
  };
}
