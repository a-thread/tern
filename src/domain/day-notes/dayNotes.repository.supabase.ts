import type { TernClient } from '@shared/backend/supabase';
import { allRows, ok } from '@shared/backend/query';
import type { DayNote } from './models/dayNote';
import type { DayNotesRepository } from './dayNotes.repository';

type DayNoteRow = { day: string; note: string };

export const rowToDayNote = (row: DayNoteRow): DayNote => ({
  day: row.day,
  text: row.note,
});

export function createSupabaseDayNotesRepository(
  db: TernClient,
): DayNotesRepository {
  return {
    async load(from, to) {
      return (
        await allRows<DayNoteRow>((start, end) =>
          db
            .from('day_notes')
            .select('day, note')
            .gte('day', from)
            .lte('day', to)
            .order('day', { ascending: true })
            .range(start, end),
        )
      ).map(rowToDayNote);
    },
    async save(note) {
      // One row per day: writing again replaces it.
      await ok(
        db.from('day_notes').upsert(
          {
            day: note.day,
            note: note.text,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,day' },
        ),
      );
    },
    async remove(day) {
      await ok(db.from('day_notes').delete().eq('day', day));
    },
  };
}
