import type { Units } from '@shared/utils/units';

/** Seed data only — the values SettingsContext initializes from. */
export const profile = {
  name: 'Sam',
};

export const settingsSeed = {
  units: 'imperial' as Units,
  stepGoal: 8000,
  calorieTarget: 2100,
  macroTargets: { protein: 119, carbs: 253, fat: 62 },
  weightGoalLb: 163,
  showTiers: true,
  showCalories: true,
};
