import { useSettings } from '@settings/SettingsContext';

/** The Settings → Food display preferences, in one place so every food screen honors them the same way. */
export function useFoodDisplay() {
  const { settings } = useSettings();
  return {
    showTiers: settings.showTiers,
    showTierNumber: settings.showTierNumber,
    showCalories: settings.showCalories,
  };
}
