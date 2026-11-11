import { Units } from '@shared/utils/units';
import type { TernExport } from '@/domain/settings/models/ternExport';
import {
  appointmentSummary,
  type SummaryChoices,
  SummarySpan,
} from './appointmentSummary';

const TODAY = '2026-11-08';

const data = (over: Partial<TernExport> = {}): TernExport => ({
  exportedAt: '2026-11-08T12:00:00.000Z',
  weightUnit: 'lb',
  settings: null,
  food: [
    { logged_on: '2026-11-08', meal: 'breakfast', name: 'Oatmeal', calories: 300 },
    { logged_on: '2026-11-08', meal: 'breakfast', name: 'Banana', calories: 100 },
    { logged_on: '2026-10-01', meal: 'dinner', name: 'Too long ago', calories: 500 },
  ],
  weight: [{ lb: 160, logged_at: '2026-11-07T08:00:00' }],
  waypoints: [],
  restDays: [{ day: '2026-11-06' }],
  savedMeals: [],
  medicationDoses: [],
  waterEntries: [],
  moodCheckins: [{ day: '2026-11-08', mood: 7, stress: 3 }],
  mealCheckins: [
    { day: '2026-11-08', meal: 'breakfast', fullness: 3, feeling: 4, note: 'private' },
  ],
  skippedMeals: [{ day: '2026-11-08', meal: 'lunch' }],
  skippedWeighIns: [],
  movementEntries: [{ day: '2026-11-07', activity: 'walk', minutes: 30 }],
  dayNotes: [{ day: '2026-11-08', text: 'a private note' }],
  ...over,
});

const ALL_ON: SummaryChoices = {
  trackFood: true,
  trackCalories: true,
  showCalories: true,
  trackWeight: true,
  trackMood: true,
  trackMovement: true,
  units: Units.Imperial,
};

describe('appointmentSummary', () => {
  it('lists the meals in the span, with skipped meals and how they sat', () => {
    const text = appointmentSummary(data(), ALL_ON, SummarySpan.TwoWeeks, TODAY);
    expect(text).toContain('Days with meals logged: 1 of 14');
    expect(text).toContain('  Breakfast: Oatmeal, Banana (Satisfied, feeling good)');
    expect(text).toContain('  Lunch: nothing today');
    expect(text).toContain('  About 400 calories');
    expect(text).not.toContain('Too long ago');
  });

  it('leaves out written notes', () => {
    const text = appointmentSummary(data(), ALL_ON, SummarySpan.TwoWeeks, TODAY);
    expect(text).not.toContain('private');
  });

  it('shows no calories when they are hidden, and no weight when it is off', () => {
    const text = appointmentSummary(
      data(),
      { ...ALL_ON, showCalories: false, trackWeight: false },
      SummarySpan.TwoWeeks,
      TODAY,
    );
    expect(text).not.toContain('calories');
    expect(text).not.toContain('WEIGHT');
    expect(text).not.toContain('160');
  });

  it('gives weight, mood, movement and rest days', () => {
    const text = appointmentSummary(data(), ALL_ON, SummarySpan.FourWeeks, TODAY);
    expect(text).toContain('  Nov 7: 160.0 lb');
    expect(text).toContain('  Nov 8: mood 7/10 (good), stress 3/10 (relaxed)');
    expect(text).toContain('  Days with movement logged: 1 of 28');
    expect(text).toContain('  Rest days taken: 1');
  });
});
