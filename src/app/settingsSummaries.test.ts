import { initialSettings, type AppSettings } from '@settings/models/appSettings';
import { Units } from '@shared/utils/units';
import { Frequency } from '@shared/models/frequency';
import {
  activeReminderCount,
  healthDataSummary,
  remindersSummary,
} from '@settings/models/settingsSummary';
import { activitySummary } from '@today/models/settingsSummary';
import { foodSummary } from '@food/models/settingsSummary';
import { weightSummary } from '@weight/models/settingsSummary';
import { waterSummary } from '@water/models/settingsSummary';
import { moodSummary } from '@mood/models/settingsSummary';
import { medicationSummary } from '@medication/models/settingsSummary';

// The one-line summaries on the Settings index, each owned by its feature.

const with_ = (patch: Partial<AppSettings>): AppSettings => ({ ...initialSettings, ...patch });

describe('settings index summaries', () => {
  it('sums up steps and activity', () => {
    expect(activitySummary(with_({ stepGoal: 8000, restDaysPerWeek: 2, trackMovement: false }))).toBe(
      '8,000 steps · 2 rest days',
    );
    expect(activitySummary(with_({ stepGoal: 10000, restDaysPerWeek: 1, trackMovement: true }))).toBe(
      '10,000 steps · 1 rest day · movement on',
    );
  });

  it('sums up food as calories and the macro split, or says calories are off', () => {
    // The split is by calories, in whole percents that add to 100.
    const on = with_({ trackCalories: true, calorieTarget: 2100, macroTargets: { protein: 150, carbs: 225, fat: 70 } });
    expect(foodSummary(on)).toMatch(/^2,100 cal · \d+ \/ \d+ \/ \d+$/);
    const [p, c, f] = foodSummary(on).split(' · ')[1].split(' / ').map(Number);
    expect(p + c + f).toBe(100);
    expect(foodSummary(with_({ trackCalories: false }))).toBe('Calories off');
  });

  it('sums up weight with how often and the goal, in the chosen units', () => {
    expect(weightSummary(with_({ trackWeight: false }))).toBe('Off');
    expect(weightSummary(with_({ trackWeight: true, weighInFrequency: Frequency.Weekly, weightGoalLb: null }))).toBe(
      'Weekly',
    );
    expect(
      weightSummary(with_({ trackWeight: true, weighInFrequency: Frequency.Daily, weightGoalLb: 150, units: Units.Imperial })),
    ).toBe('Daily · goal 150 lb');
    expect(weightSummary(with_({ trackWeight: true, weightGoalLb: 150, units: Units.Metric }))).toMatch(/goal 68 kg$/);
  });

  it('sums up water in the chosen units, or off', () => {
    expect(waterSummary(with_({ trackWater: false }))).toBe('Off');
    expect(waterSummary(with_({ trackWater: true, waterGoalOz: 64, units: Units.Imperial }))).toBe('64 oz a day');
    expect(waterSummary(with_({ trackWater: true, waterGoalOz: 64, units: Units.Metric }))).toMatch(/ml a day$/);
  });

  it('sums up mood and medication', () => {
    expect(moodSummary(with_({ trackMood: true }))).toBe('Daily check-in');
    expect(moodSummary(with_({ trackMood: false }))).toBe('Off');
    expect(medicationSummary(with_({ medications: [] }))).toBe('Optional');
    expect(
      medicationSummary(with_({ medications: [{ id: 'a', name: 'A', at: 480 }, { id: 'b', name: 'B', at: 1200 }] as AppSettings['medications'] })),
    ).toBe('2 tracked');
  });

  it('counts only reminders that will fire: on, and for something tracked', () => {
    const all = {
      mealLog: { ...initialSettings.reminders.mealLog, on: true },
      weighIn: { ...initialSettings.reminders.weighIn, on: true },
      water: { ...initialSettings.reminders.water, on: true },
      mood: { ...initialSettings.reminders.mood, on: true },
      streak: { on: true },
    };
    expect(activeReminderCount(with_({ reminders: all, trackWeight: true, trackWater: true, trackMood: true }))).toBe(5);
    expect(activeReminderCount(with_({ reminders: all, trackWeight: false, trackWater: false, trackMood: false }))).toBe(2);
    expect(remindersSummary(with_({ reminders: all, trackWeight: true, trackWater: false, trackMood: false }))).toBe('3 on');

    const none = {
      ...all,
      mealLog: { ...all.mealLog, on: false },
      weighIn: { ...all.weighIn, on: false },
      streak: { on: false },
    };
    expect(remindersSummary(with_({ reminders: none, trackWater: false, trackMood: false }))).toBe('Off');
  });

  it('says what health data is read', () => {
    expect(healthDataSummary(with_({ healthData: { readSteps: true, readWorkouts: true } }))).toBe('Steps and workouts');
    expect(healthDataSummary(with_({ healthData: { readSteps: true, readWorkouts: false } }))).toBe('Steps');
    expect(healthDataSummary(with_({ healthData: { readSteps: false, readWorkouts: false } }))).toBe(
      'Not reading anything',
    );
  });
});
