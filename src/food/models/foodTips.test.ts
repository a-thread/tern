import { foodTipTargets, foodTipText } from './foodTips';
import { Tip } from '@/domain/settings/models/onboarding';
import { Meal, type FoodEntry } from '@/domain/food/models/foodEntry';

const food = (id: string, meal: Meal) => ({ id, meal }) as FoodEntry;

describe('foodTipTargets', () => {
  it('points at the first open core meal and the first food in day order', () => {
    expect(
      foodTipTargets({
        editable: true,
        foodLog: [food('snack', Meal.Snack), food('eggs', Meal.Breakfast)],
        skippedMeals: [Meal.Lunch],
      }),
    ).toEqual({ skipMeal: Meal.Dinner, firstFoodId: 'eggs' });
  });

  it('has nothing to point at on a day that can only be looked at', () => {
    expect(
      foodTipTargets({ editable: false, foodLog: [], skippedMeals: [] }),
    ).toEqual({ skipMeal: null, firstFoodId: null });
  });

  it('has no skip row once every core meal is logged or skipped', () => {
    expect(
      foodTipTargets({
        editable: true,
        foodLog: [food('a', Meal.Breakfast), food('b', Meal.Lunch)],
        skippedMeals: [Meal.Dinner],
      }).skipMeal,
    ).toBeNull();
  });
});

describe('foodTipText', () => {
  it('names the meal it points at', () => {
    expect(foodTipText(Tip.FoodSkipMeal, 'lunch').lead).toBe(
      '“No lunch today” counts as logged.',
    );
  });
});
