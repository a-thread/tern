import type { AppSettings } from '../../domain/settings/models/appSettings';
import { percentsFromMacros } from '../../domain/food/models/macroSplit';

/**
 * The Settings index line for food: "2,100 cal · 30 / 40 / 30" (protein / carbs / fat), just
 * the calories or just the split when only one is tracked, "Calories off", or "Off" when food
 * isn't logged at all.
 */
export function foodSummary(s: AppSettings): string {
  if (!s.trackFood) return 'Off';
  const split = percentsFromMacros(s.macroTargets);
  const macros = `${split.protein} / ${split.carbs} / ${split.fat}`;
  const calories = `${s.calorieTarget.toLocaleString('en-US')} cal`;
  if (s.trackCalories && s.trackMacros) return `${calories} · ${macros}`;
  if (s.trackCalories) return calories;
  if (s.trackMacros) return `Macros ${macros}`;
  return 'Calories off';
}
