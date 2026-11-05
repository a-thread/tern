import { useSettings } from '../../settings/SettingsContext';

/** The Settings → Food display preferences, in one place so every food screen honors them the same way. */
export function useFoodDisplay() {
  const { settings } = useSettings();
  return {
    showTiers: settings.showTiers,
    showTierNumber: settings.showTierNumber,
    // No calorie numbers anywhere once calorie tracking is off: there is nothing
    // to count, so the separate "show calorie counts" switch has nothing to decide.
    showCalories:
      settings.trackFood && settings.trackCalories && settings.showCalories,
    /**
     * Calories are recorded, whether or not counts are shown: anywhere food is entered asks
     * for them, or a hidden count would be saved as zero.
     */
    tracksCalories: settings.trackFood && settings.trackCalories,
    /** Protein, carbs and fat; tracked on their own switch, apart from calories. */
    showMacros: settings.trackFood && settings.trackMacros,
    /**
     * Calories, macros or processing levels are tracked, so the intake bars have a page to show.
     * Processing levels alone are enough: the split needs no calorie or macro targets.
     */
    hasIntakeSummary:
      settings.trackFood &&
      (settings.trackCalories || settings.trackMacros || settings.showTiers),
  };
}
