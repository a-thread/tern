import React from 'react';

import { colors } from '@shared/theme';
import { IconBadge, Row, Icon } from '@shared/components/ui';
import { savedMealTotals, type SavedMeal } from '@/domain/saved-meals/models/savedMeals';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';

/** A saved meal: its name, how many foods it holds and, if shown, its calories. */
export function SavedMealRow({ meal, onPress }: { meal: SavedMeal; onPress: () => void }) {
  const { showCalories } = useFoodDisplay();
  const cals = Math.round(savedMealTotals(meal.items).calories);
  const n = meal.items.length;
  return (
    <Row
      icon={
        <IconBadge bg={colors.doveTint} size={19}>
          <Icon name='bookmark-outline' size={15} color={colors.ink2} />
        </IconBadge>
      }
      title={meal.name}
      sub={`${n} ${n === 1 ? 'food' : 'foods'}${showCalories ? ` · ${cals} cal` : ''}`}
      chevron
      onPress={onPress}
    />
  );
}
