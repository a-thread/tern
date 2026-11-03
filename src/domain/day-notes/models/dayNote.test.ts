import {
  cleanDayNote,
  DayNoteText,
  notedDays,
  noteFor,
  notesBetween,
} from './dayNote';

describe('cleanDayNote', () => {
  it('trims, caps, and drops a blank note', () => {
    expect(cleanDayNote('  joint pain  ')).toBe('joint pain');
    expect(cleanDayNote('   ')).toBeUndefined();
    expect(cleanDayNote(null)).toBeUndefined();
    expect(cleanDayNote('x'.repeat(DayNoteText.MAX_LENGTH + 20))).toHaveLength(
      DayNoteText.MAX_LENGTH,
    );
  });
});

describe('notes', () => {
  const list = [
    { day: '2026-10-19', text: 'b' },
    { day: '2026-10-18', text: 'a' },
    { day: '2026-10-25', text: 'c' },
  ];

  it('finds a day', () => {
    expect(noteFor(list, '2026-10-18')?.text).toBe('a');
    expect(noteFor(list, '2026-10-01')).toBeUndefined();
  });

  it('lists the noted days', () => {
    expect(notedDays(list)).toEqual(
      new Set(['2026-10-19', '2026-10-18', '2026-10-25']),
    );
  });

  it('slices a range inclusively, newest first', () => {
    expect(
      notesBetween(list, '2026-10-18', '2026-10-19').map((n) => n.day),
    ).toEqual(['2026-10-19', '2026-10-18']);
  });
});
