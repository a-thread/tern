import type { SavedMeal } from './savedMeals';

/** Where saved meals are stored. `save` inserts or updates by id. */
export interface SavedMealsRepository {
  list(): Promise<SavedMeal[]>;
  save(meal: SavedMeal): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createMemorySavedMealsRepository(
  initial: SavedMeal[] = [],
): SavedMealsRepository {
  let meals = [...initial];
  return {
    list: async () => meals.map((m) => ({ ...m, items: [...m.items] })),
    save: async (meal) => {
      meals = meals.some((m) => m.id === meal.id)
        ? meals.map((m) => (m.id === meal.id ? meal : m))
        : [...meals, meal];
    },
    remove: async (id) => {
      meals = meals.filter((m) => m.id !== id);
    },
  };
}
