import type { Units } from '@shared/utils/units';

/** Seed data only — the values SettingsContext initializes from. */
export const settingsSeed = {
  units: 'imperial' as Units,
  stepGoal: 4800,
  calorieTarget: 2100,
  macroTargets: { protein: 119, carbs: 253, fat: 62 },
  showTiers: true,
  showCalories: true,
};
