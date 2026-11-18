import type { AppSettings } from '../../domain/settings/models/appSettings';
import { percentsFromMacros } from '../../domain/food/models/macroSplit';

/** "2,100 cal · 30 / 40 / 30" (P/C/F), "Calories off", or "Off". */
export function foodSummary(s: AppSettings): string {
  // Food off still has its reminders to eat on this page, so say when they're on.
  if (!s.trackFood) return s.reminders.eat.on ? 'Reminders to eat' : 'Off';
  const split = percentsFromMacros(s.macroTargets);
  const macros = `${split.protein} / ${split.carbs} / ${split.fat}`;
  const calories = `${s.calorieTarget.toLocaleString('en-US')} cal`;
  if (s.trackCalories && s.trackMacros) return `${calories} · ${macros}`;
  if (s.trackCalories) return calories;
  if (s.trackMacros) return `Macros ${macros}`;
  return 'Calories off';
}
