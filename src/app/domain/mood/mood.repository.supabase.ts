import type { TernClient } from '@/shared/backend/supabase';
import { ok, rows } from '@/shared/backend/query';
import type { MoodEntry } from '@/domain/mood/models/moodEntry';
import type { MoodRepository } from '@/domain/mood/mood.repository';

type MoodRow = { day: string; mood: number; stress: number };

export const rowToMood = (row: MoodRow): MoodEntry => ({
  day: row.day,
  mood: Number(row.mood),
  stress: Number(row.stress),
});

export function createSupabaseMoodRepository(db: TernClient): MoodRepository {
  return {
    async load(from, to) {
      return (
        await rows<MoodRow>(
          db
            .from('mood_checkins')
            .select('day, mood, stress')
            .gte('day', from)
            .lte('day', to)
            .order('day', { ascending: true })
            .limit(1000),
        )
      ).map(rowToMood);
    },
    async save(entry) {
      // One row per day: checking in again replaces it.
      await ok(
        db
          .from('mood_checkins')
          .upsert(
            {
              day: entry.day,
              mood: entry.mood,
              stress: entry.stress,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,day' },
          ),
      );
    },
    async remove(day) {
      await ok(db.from('mood_checkins').delete().eq('day', day));
    },
  };
}
