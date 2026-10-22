import type { LocalDb } from '@shared/backend/localDb';
import { rowToMood } from './mood.repository.supabase';
import type { MoodRepository } from './mood.repository';

export function createLocalMoodRepository(db: LocalDb): MoodRepository {
  return {
    async load(from, to) {
      return (
        await db.all<Parameters<typeof rowToMood>[0]>(
          'SELECT day, mood, stress FROM mood_checkins WHERE day BETWEEN ? AND ? ORDER BY day',
          [from, to],
        )
      ).map(rowToMood);
    },
    async save(entry) {
      // One row per day: checking in again replaces it.
      await db.run(
        'INSERT OR REPLACE INTO mood_checkins (day, mood, stress, updated_at) VALUES (?, ?, ?, ?)',
        [entry.day, entry.mood, entry.stress, new Date().toISOString()],
      );
    },
    async remove(day) {
      await db.run('DELETE FROM mood_checkins WHERE day = ?', [day]);
    },
  };
}
