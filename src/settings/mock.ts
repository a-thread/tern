/** Seed data only — the values SettingsContext initializes from. */
export const profile = {
  name: 'Sam',
  units: 'metric' as const,
};

export const settingsSeed = {
  stepGoal: 8000,
  calorieTarget: 2100,
  macroTargets: { protein: 119, carbs: 253, fat: 62 },
  weightGoalKg: 74,
  showTiers: true,
  showCalories: true,
};
