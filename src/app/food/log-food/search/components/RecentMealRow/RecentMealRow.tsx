import React from 'react';

import { colors } from '@/shared/theme';
import { IconBadge, Row, Icon } from '@/shared/components/ui';
import { savedMealTotals } from '@/domain/saved-meals/models/savedMeals';
import type { RecentMeal } from '@/food/log-food/models/recentMeals';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';

/** A meal from a past day: the day and meal it was, and what was in it. */
export function RecentMealRow({
  meal,
  onPress,
}: {
  meal: RecentMeal;
  onPress: () => void;
}) {
  const { showCalories } = useFoodDisplay();
  const cals = Math.round(savedMealTotals(meal.items).calories);
  const n = meal.items.length;
  const names = meal.items.map((i) => i.name).join(', ');
  return (
    <Row
      icon={
        <IconBadge bg={colors.doveTint} size={19}>
          <Icon name='history' size={15} color={colors.ink2} />
        </IconBadge>
      }
      title={meal.title}
      sub={`${showCalories ? `${cals} cal` : `${n} ${n === 1 ? 'food' : 'foods'}`} · ${names}`}
      subLines={1}
      chevron
      onPress={onPress}
    />
  );
}
