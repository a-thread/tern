import { useRef } from 'react';
import type { HostInstance } from 'react-native';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useTips } from '@shared/hooks/useTips';
import { useFood } from '@/domain/food/FoodContext';
import { Meals } from '@/domain/food/models/meals';
import { Tip, Tips } from '@/domain/settings/models/onboarding';
import { foodTipTargets, foodTipText } from '../models/foodTips';

/** Each applies only when its row is there to point at. */
export function useFoodTips() {
  const rootRef = useRef<HostInstance>(null);
  const skipMealRef = useRef<HostInstance>(null);
  const firstFoodRef = useRef<HostInstance>(null);
  const { day, editable, isToday } = useViewedDay();
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
    text: tips.shown
      ? foodTipText(tips.shown.tip, mealName, isToday ? 'today' : 'yesterday')
      : null,
  };
}
