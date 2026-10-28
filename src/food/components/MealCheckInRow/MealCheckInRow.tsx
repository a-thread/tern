import React from 'react';

import { colors } from '@shared/theme';
import { Icon, IconBadge, Row } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import type { Meal } from '@/domain/food/models/foodEntry';
import { useMealCheckIns } from '@/domain/meal-check-ins/MealCheckInsContext';
import { describeMealCheckIn } from '@/domain/meal-check-ins/models/mealCheckIn';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/**
 * Under a meal's foods, while "Ask how meals went" is on: how the meal sat, or a way to say.
 * On a day that can only be looked at, the screen shows it only for a check-in that was made.
 */
export function MealCheckInRow({ meal }: { meal: Meal }) {
  const navigation = useRootNavigation();
  const { editable } = useViewedDay();
  const { forMeal } = useMealCheckIns();
  const done = forMeal(meal);

  return (
    <Row
      title={done ? 'How it went' : 'How was it?'}
      sub={
        done
          ? describeMealCheckIn(done) + (done.note ? ` · “${done.note}”` : '')
          : 'Fullness, how you feel, and a note'
      }
      // A long note is cut short here; the check-in shows it whole.
      subLines={2}
      icon={
        <IconBadge bg={colors.violetTint}>
          <Icon name='emoticon-happy-outline' size={16} color={colors.violet} />
        </IconBadge>
      }
      chevron={editable}
      onPress={
        editable
          ? () => navigation.navigate('MealCheckIn', { meal })
          : undefined
      }
    />
  );
}
