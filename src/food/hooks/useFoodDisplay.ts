import { useSettings } from '@settings/SettingsContext';

/** The Settings → Food display preferences, in one place so every food screen honors them the same way. */
export function useFoodDisplay() {
  const { settings } = useSettings();
  return {
    showTiers: settings.showTiers,
    showTierNumber: settings.showTierNumber,
    // No calorie numbers anywhere once calorie tracking is off: there is nothing
    // to count, so the separate "show calorie counts" switch has nothing to decide.
    showCalories: settings.trackCalories && settings.showCalories,
  };
}
