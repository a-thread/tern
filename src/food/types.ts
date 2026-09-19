import type { FoodEntry } from './models';
import type { SearchResult } from './searchData';

export type LogFoodStackParamList = {
  Search: { meal: FoodEntry['meal'] };
  BarcodeScan: { meal: FoodEntry['meal'] };
  FoodDetail: { meal: FoodEntry['meal']; result: SearchResult };
  ManualFoodEntry: { meal: FoodEntry['meal']; name?: string };
};
