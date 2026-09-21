import {
  MAX_MED_NAME,
  cleanMedName,
  dueMeds,
  isScheduledOn,
  mergeMedications,
  newMedication,
  takenMeds,
  validateMedName,
  type Medication,
} from './medications';

const med = (
  id: string,
  name: string,
  at = 480,
  remind = false,
  schedule: Partial<Pick<Medication, 'frequency' | 'weekday'>> = {},
): Medication => ({
  id,
  name,
  at,
  frequency: 'daily',
  weekday: 1,
  remind,
  ...schedule,
});

describe('validateMedName', () => {
  const existing = [med('a', 'Vitamin D')];

  it('accepts a fresh name', () => {
    expect(validateMedName('Iron', existing)).toBeNull();
  });

  it('rejects empty and over-long names', () => {
    expect(validateMedName('   ', existing)).not.toBeNull();
    expect(validateMedName('x'.repeat(MAX_MED_NAME + 1), existing)).not.toBeNull();
    expect(validateMedName('x'.repeat(MAX_MED_NAME), existing)).toBeNull();
  });

  it('rejects a duplicate ignoring case and spacing, but lets a medication keep its own name', () => {
    expect(validateMedName('  vitamin   d ', existing)).not.toBeNull();
    expect(validateMedName('Vitamin D', existing, 'a')).toBeNull();
  });
});

describe('cleanMedName / newMedication', () => {
  it('trims and collapses spaces', () => {
    expect(cleanMedName('  Vitamin   D  ')).toBe('Vitamin D');
  });

  it('starts at the default time with no reminder', () => {
    expect(newMedication(' Iron ', 'id1')).toEqual({
      id: 'id1',
      name: 'Iron',
      at: 480,
      frequency: 'daily',
      weekday: 1,
      remind: false,
    });
  });
});

describe('dueMeds / takenMeds', () => {
  const meds = [med('a', 'Evening pill', 20 * 60), med('b', 'Morning pill', 8 * 60), med('c', 'Iron', 8 * 60)];

  it('lists what is not yet taken, earliest first', () => {
    expect(dueMeds(meds, new Set(['b']), 3).map((m) => m.id)).toEqual(['c', 'a']);
  });

  it('lists what is taken', () => {
    expect(takenMeds(meds, new Set(['a', 'b'])).map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('is empty when nothing is tracked', () => {
    expect(dueMeds([], new Set(), 1)).toEqual([]);
  });

  it('a weekly medication is only due on its weekday', () => {
    const weekly = med('w', 'Injection', 600, false, { frequency: 'weekly', weekday: 4 });
    const all = [med('d', 'Daily pill'), weekly];
    expect(dueMeds(all, new Set(), 4).map((m) => m.id)).toEqual(['d', 'w']);
    expect(dueMeds(all, new Set(), 5).map((m) => m.id)).toEqual(['d']);
    expect(dueMeds(all, new Set(['w']), 4).map((m) => m.id)).toEqual(['d']);
  });
});

describe('isScheduledOn', () => {
  it('daily is every day, weekly only on its weekday', () => {
    expect(isScheduledOn(med('a', 'A'), 6)).toBe(true);
    const weekly = med('b', 'B', 480, false, { frequency: 'weekly', weekday: 2 });
    expect(isScheduledOn(weekly, 2)).toBe(true);
    expect(isScheduledOn(weekly, 3)).toBe(false);
  });
});

describe('mergeMedications', () => {
  it('keeps well-formed entries and drops junk', () => {
    const merged = mergeMedications([
      { id: 'a', name: ' Iron ', at: 600, remind: true, frequency: 'weekly', weekday: 5 },
      { id: 'a', name: 'Duplicate id', at: 600 },
      { id: 'b', name: '', at: 600 },
      { name: 'No id' },
      null,
      { id: 'c', name: 'Bad time', at: 9999, remind: 'yes' },
    ]);
    expect(merged).toEqual([
      { id: 'a', name: 'Iron', at: 600, frequency: 'weekly', weekday: 5, remind: true },
      { id: 'c', name: 'Bad time', at: 480, frequency: 'daily', weekday: 1, remind: false },
    ]);
  });

  it('treats anything that is not a list as empty', () => {
    expect(mergeMedications(undefined)).toEqual([]);
    expect(mergeMedications('nope')).toEqual([]);
  });
});
