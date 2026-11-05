import { useSettings } from '../../settings/SettingsContext';

/** The Settings → Food display preferences, in one place so every food screen honors them the same way. */
export function useFoodDisplay() {
  const { settings } = useSettings();
  const tracksNutrients =
    settings.trackFood && (settings.trackCalories || settings.trackMacros);
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
    /** Calories or macros are tracked, so there are nutrient totals and targets. */
    tracksNutrients,
    /**
     * The intake bars have a page to show: nutrients, or processing levels on their own (the
     * split needs no calorie or macro targets).
     */
    hasIntakeSummary:
      tracksNutrients || (settings.trackFood && settings.showTiers),
  };
}
