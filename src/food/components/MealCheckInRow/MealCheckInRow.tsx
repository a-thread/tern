import React from 'react';

import { colors } from '@shared/theme';
import { Icon, IconBadge, Row } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import type { Meal } from '@/domain/food/models/foodEntry';
import { useMealCheckIns } from '@/domain/meal-check-ins/MealCheckInsContext';
import { describeMealCheckIn } from '@/domain/meal-check-ins/models/mealCheckIn';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/**
 * Displays a meal check-in when "Ask how meals went" is enabled.
 * On past non-editable days, only existing check-ins will appear.
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
