import type { AppSettings } from '@settings/models/appSettings';
import { percentsFromMacros } from '@food/models/macroSplit';

/** The Settings index line for food: "2,100 cal · 30 / 40 / 30" (protein / carbs / fat), or "Calories off". */
export function foodSummary(s: AppSettings): string {
  if (!s.trackCalories) return 'Calories off';
  const split = percentsFromMacros(s.macroTargets);
  return `${s.calorieTarget.toLocaleString('en-US')} cal · ${split.protein} / ${split.carbs} / ${split.fat}`;
}
