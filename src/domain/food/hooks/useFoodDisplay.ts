import { useSettings } from '../../settings/SettingsContext';

/** The Settings → Food display preferences, in one place so every food screen honors them the same way. */
export function useFoodDisplay() {
  const { settings } = useSettings();
  const tracksNutrients =
    settings.trackFood && (settings.trackCalories || settings.trackMacros);
  return {
    showTiers: settings.showTiers,
    showTierNumber: settings.showTierNumber,
    // With tracking off, "show calorie counts" has nothing to decide.
    showCalories:
      settings.trackFood && settings.trackCalories && settings.showCalories,
    /** Recorded even when hidden, so food entry still asks or they'd save as zero. */
    tracksCalories: settings.trackFood && settings.trackCalories,
    /** Protein, carbs and fat; tracked on their own switch, apart from calories. */
    showMacros: settings.trackFood && settings.trackMacros,
    /** Calories or macros are tracked, so there are nutrient totals and targets. */
    tracksNutrients,
    /** Nutrients, or processing levels alone (which need no targets). */
    hasIntakeSummary:
      tracksNutrients || (settings.trackFood && settings.showTiers),
  };
}
