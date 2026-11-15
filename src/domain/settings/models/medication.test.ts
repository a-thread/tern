import {
  cleanMedName,
  mergeMedications,
  newMedication,
  validateMedName,
  type Medication,
  MedicationLimits,
} from './medication';
import { Frequency } from '@shared/models/frequency';

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
  frequency: Frequency.Daily,
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
    expect(
      validateMedName(
        'x'.repeat(MedicationLimits.MAX_NAME_LENGTH + 1),
        existing,
      ),
    ).not.toBeNull();
    expect(
      validateMedName('x'.repeat(MedicationLimits.MAX_NAME_LENGTH), existing),
    ).toBeNull();
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

  it('starts at the default time with no reminder, tracked from the day it is added', () => {
    expect(newMedication(' Iron ', 'id1', '2026-11-15')).toEqual({
      id: 'id1',
      name: 'Iron',
      at: 480,
      frequency: 'daily',
      weekday: 1,
      remind: false,
      since: '2026-11-15',
    });
  });
});

describe('mergeMedications', () => {
  it('keeps well-formed entries and drops junk', () => {
    const merged = mergeMedications([
      {
        id: 'a',
        name: ' Iron ',
        at: 600,
        remind: true,
        frequency: 'weekly',
        weekday: 5,
      },
      { id: 'a', name: 'Duplicate id', at: 600 },
      { id: 'b', name: '', at: 600 },
      { name: 'No id' },
      null,
      { id: 'c', name: 'Bad time', at: 9999, remind: 'yes' },
    ]);
    expect(merged).toEqual([
      {
        id: 'a',
        name: 'Iron',
        at: 600,
        frequency: 'weekly',
        weekday: 5,
        remind: true,
      },
      {
        id: 'c',
        name: 'Bad time',
        at: 480,
        frequency: 'daily',
        weekday: 1,
        remind: false,
      },
    ]);
  });

  it('keeps a start day only when it is a day', () => {
    const [kept, dropped] = mergeMedications([
      { id: 'a', name: 'Iron', since: '2026-11-15' },
      { id: 'b', name: 'Zinc', since: 'yesterday' },
    ]);
    expect(kept.since).toBe('2026-11-15');
    expect(dropped).not.toHaveProperty('since');
  });

  it('treats anything that is not a list as empty', () => {
    expect(mergeMedications(undefined)).toEqual([]);
    expect(mergeMedications('nope')).toEqual([]);
  });
});
