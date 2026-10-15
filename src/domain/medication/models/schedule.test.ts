import { dueMeds, isScheduledOn, takenMeds } from './schedule';
import type { Medication } from '../../settings/models/medication';
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
    const weekly = med('w', 'Injection', 600, false, { frequency: Frequency.Weekly, weekday: 4 });
    const all = [med('d', 'Daily pill'), weekly];
    expect(dueMeds(all, new Set(), 4).map((m) => m.id)).toEqual(['d', 'w']);
    expect(dueMeds(all, new Set(), 5).map((m) => m.id)).toEqual(['d']);
    expect(dueMeds(all, new Set(['w']), 4).map((m) => m.id)).toEqual(['d']);
  });
});

describe('isScheduledOn', () => {
  it('daily is every day, weekly only on its weekday', () => {
    expect(isScheduledOn(med('a', 'A'), 6)).toBe(true);
    const weekly = med('b', 'B', 480, false, { frequency: Frequency.Weekly, weekday: 2 });
    expect(isScheduledOn(weekly, 2)).toBe(true);
    expect(isScheduledOn(weekly, 3)).toBe(false);
  });
});
