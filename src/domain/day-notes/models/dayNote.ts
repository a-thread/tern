/** One day's note: how the body felt, what shaped the day. `day` is the local day (YYYY-MM-DD). */
export type DayNote = { day: string; text: string };

/** The free-text note on a day. */
export class DayNoteText {
  static readonly MAX_LENGTH = 500;
}

/** A note as stored: trimmed, capped, and absent when only blank space was typed. */
export function cleanDayNote(
  text: string | null | undefined,
): string | undefined {
  const trimmed = (text ?? '').trim().slice(0, DayNoteText.MAX_LENGTH);
  return trimmed ? trimmed : undefined;
}

export const noteFor = (notes: DayNote[], day: string): DayNote | undefined =>
  notes.find((n) => n.day === day);

/** The days that have a note, for marking them on a chart. */
export const notedDays = (notes: DayNote[]): Set<string> =>
  new Set(notes.map((n) => n.day));

/** Every note, newest first. */
export const newestFirst = (notes: DayNote[]): DayNote[] =>
  [...notes].sort((a, b) => b.day.localeCompare(a.day));

/** Notes from `from` to `to` inclusive, newest first. */
export const notesBetween = (
  notes: DayNote[],
  from: string,
  to: string,
): DayNote[] => newestFirst(notes.filter((n) => n.day >= from && n.day <= to));
