import { useRef } from 'react';

import { useDayKey } from '@shared/hooks/useDayKey';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useActivity } from './domain/activity/ActivityContext';
import { useFood } from './domain/food/FoodContext';
import { allMealsLogged, mealDone } from './domain/food/models/meals';
import { Meal } from './domain/food/models/foodEntry';
import { useMedication } from './domain/medication/MedicationContext';
import { useMood } from './domain/mood/MoodContext';
import { type DoneToday } from './domain/settings/models/reminderPlan';
import { useWater } from './domain/water/WaterContext';
import { useWeight } from './domain/weight/WeightContext';
import { isLoggedOn } from './domain/weight/models/weightEntry';

/** Tracks today's completed goals and whether their data is loaded.
 * Viewed-day domains retain today's values while showing a past day.
 */
export function useDoneToday(): { done: DoneToday; ready: boolean } {
  const today = useDayKey();
  const { isToday } = useViewedDay();
  const activity = useActivity();
  const food = useFood();
  const weight = useWeight();
  const water = useWater();
  const mood = useMood();
  const meds = useMedication();

  const viewed = useRef({
    meals: false,
    lunch: false,
    dinner: false,
    water: false,
    mood: false,
  });
  if (isToday) {
    const todaysFood = food.loadedDay === today;
    // Logged, or marked as skipped: either way there's nothing to remind about.
    const doneToday = (meal: Meal) =>
      todaysFood && mealDone(meal, food.foodLog, food.skippedMeals);
    viewed.current = {
      meals: todaysFood && allMealsLogged(food.foodLog, food.skippedMeals),
      lunch: doneToday(Meal.Lunch),
      dinner: doneToday(Meal.Dinner),
      water: water.enabled && water.reached,
      mood: mood.enabled && mood.onDay !== undefined,
    };
  }

  const done: DoneToday = {
    rest: activity.todayIsRest,
    ...viewed.current,
    weighIn:
      weight.weightEntries.some((e) => isLoggedOn(e.loggedAt, today)) ||
      weight.isWeighInSkipped(today),
    medications: [...meds.takenToday].sort(),
  };
  const ready =
    activity.ready &&
    food.ready &&
    weight.ready &&
    water.ready &&
    mood.ready &&
    meds.ready;
  return { done, ready };
}
