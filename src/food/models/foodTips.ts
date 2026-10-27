import { Tip } from '@/domain/settings/models/onboarding';
import { Meals } from '@/domain/food/models/meals';
import type { FoodEntry } from '@/domain/food/models/foodEntry';

/**
 * Where the Food tab's tips can point: the first "No breakfast today" row, and the first food
 * logged (in the order the day runs). Null where there's nothing to point at.
 */
export function foodTipTargets(input: {
  editable: boolean;
  foodLog: readonly FoodEntry[];
  skippedMeals: readonly FoodEntry['meal'][];
}): { skipMeal: FoodEntry['meal'] | null; firstFoodId: string | null } {
  if (!input.editable) return { skipMeal: null, firstFoodId: null };
  const skipMeal =
    Meals.CORE.find(
      (meal) =>
        !input.skippedMeals.includes(meal) &&
        !input.foodLog.some((f) => f.meal === meal),
    ) ?? null;
  const first = Meals.OPTIONS.map(({ key }) =>
    input.foodLog.find((f) => f.meal === key),
  ).find(Boolean);
  return { skipMeal, firstFoodId: first?.id ?? null };
}

/** What each tip on the Food tab says: a bold opening, then the rest. */
export function foodTipText(
  tip: Tip,
  mealName: string,
): { lead: string; rest: string } {
  switch (tip) {
    case Tip.FoodSkipMeal:
      return {
        lead: `“No ${mealName} today” counts as logged.`,
        rest: 'A full log never means eating more than you wanted.',
      };
    default:
      return {
        lead: 'Swipe a food left to remove it.',
        rest: 'Tap it to change how much you had.',
      };
  }
}
