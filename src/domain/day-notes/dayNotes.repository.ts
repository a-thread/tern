import type { DayNote } from './models/dayNote';

/** One free-text note per local day. */
export interface DayNotesRepository {
  /** Notes from day `from` to `to` inclusive, oldest first. */
  load(from: string, to: string): Promise<DayNote[]>;
  /** Saves the day's note, replacing any earlier one that day. */
  save(note: DayNote): Promise<void>;
  remove(day: string): Promise<void>;
}

export function createMemoryDayNotesRepository(): DayNotesRepository {
  let notes: DayNote[] = [];
  return {
    load: async (from, to) =>
      notes
        .filter((n) => n.day >= from && n.day <= to)
        .sort((a, b) => a.day.localeCompare(b.day)),
    save: async (note) => {
      notes = [...notes.filter((n) => n.day !== note.day), note];
    },
    remove: async (day) => {
      notes = notes.filter((n) => n.day !== day);
    },
  };
}
