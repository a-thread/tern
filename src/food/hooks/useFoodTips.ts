import { useRef } from 'react';
import type { View } from 'react-native';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useTips } from '@shared/hooks/useTips';
import { useFood } from '@/domain/food/FoodContext';
import { Meals } from '@/domain/food/models/meals';
import { Tip, Tips } from '@/domain/settings/models/onboarding';
import { foodTipTargets, foodTipText } from '../models/foodTips';

/**
 * The Food tab's one-time tips: that "No breakfast today" counts as logged (while a core meal
 * is still open), and that a food can be swiped away (once one is logged). Each applies only
 * when its row is there to point at; otherwise it's skipped and left out of the count.
 */
export function useFoodTips() {
  const rootRef = useRef<View>(null);
  const skipMealRef = useRef<View>(null);
  const firstFoodRef = useRef<View>(null);
  const { day, editable } = useViewedDay();
  const { foodLog, skippedMeals, loadedDay } = useFood();
  const targets = foodTipTargets({ editable, foodLog, skippedMeals });

  const tips = useTips({
    group: Tips.FOOD,
    relevant: Tips.FOOD.filter((t) =>
      t === Tip.FoodSkipMeal
        ? targets.skipMeal !== null
        : targets.firstFoodId !== null,
    ),
    anchors: {
      [Tip.FoodSkipMeal]: skipMealRef,
      [Tip.FoodSwipe]: firstFoodRef,
    },
    rootRef,
    // Not while another day's food is still loading in.
    ready: loadedDay === day,
  });

  const mealName =
    Meals.OPTIONS.find(
      (m) => m.key === targets.skipMeal,
    )?.label.toLowerCase() ?? '';
  return {
    rootRef,
    skipMealRef,
    firstFoodRef,
    ...targets,
    ...tips,
    text: tips.shown ? foodTipText(tips.shown.tip, mealName) : null,
  };
}
