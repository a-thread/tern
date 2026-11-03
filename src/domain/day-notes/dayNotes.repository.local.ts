import type { LocalDb } from '@shared/backend/localDb';
import { rowToDayNote } from './dayNotes.repository.supabase';
import type { DayNotesRepository } from './dayNotes.repository';

export function createLocalDayNotesRepository(
  db: LocalDb,
): DayNotesRepository {
  return {
    async load(from, to) {
      return (
        await db.all<Parameters<typeof rowToDayNote>[0]>(
          'SELECT day, note FROM day_notes WHERE day BETWEEN ? AND ? ORDER BY day',
          [from, to],
        )
      ).map(rowToDayNote);
    },
    async save(note) {
      // One row per day: writing again replaces it.
      await db.run(
        'INSERT OR REPLACE INTO day_notes (day, note, updated_at) VALUES (?, ?, ?)',
        [note.day, note.text, new Date().toISOString()],
      );
    },
    async remove(day) {
      await db.run('DELETE FROM day_notes WHERE day = ?', [day]);
    },
  };
}
