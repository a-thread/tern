import type { FoodEntry } from './models';
import type { SearchResult } from './searchData';

/**
 * `pick` puts the food screens in "choose a food for a saved meal" mode: the
 * food is added to the meal being edited instead of to today's log.
 */
export type LogFoodStackParamList = {
  Search: { meal: FoodEntry['meal']; pick?: boolean };
  BarcodeScan: { meal: FoodEntry['meal']; pick?: boolean };
  FoodDetail: { meal: FoodEntry['meal']; result: SearchResult; pick?: boolean };
  ManualFoodEntry: { meal: FoodEntry['meal']; name?: string; pick?: boolean };
  SavedMeal: { meal: FoodEntry['meal']; mealId: string };
  /** `recentId` is a RecentMeal id: the day and meal it was logged as. */
  RecentMeal: { meal: FoodEntry['meal']; recentId: string };
  MealEditor: undefined;
};
