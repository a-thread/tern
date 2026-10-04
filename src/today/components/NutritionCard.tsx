import React from 'react';

import { colors } from '@shared/theme';
import { Card, GroupLabel, MacroBar } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { dayTotals } from '@food/models/foodEntry';
import { useFood } from '@food/FoodContext';

/** Today's protein, carbs and fat against their targets. Hidden when calories aren't tracked. */
export function NutritionCard() {
  const { foodLog } = useFood();
  const { settings } = useSettings();
  if (!settings.trackCalories) return null;
  const totals = dayTotals(foodLog);
  return (
    <>
      <GroupLabel>Nutrition today</GroupLabel>
      <Card>
        <MacroBar
          label='Protein'
          current={Math.round(totals.protein)}
          target={settings.macroTargets.protein}
          color={colors.kelp}
        />
        <MacroBar
          label='Carbs'
          current={Math.round(totals.carbs)}
          target={settings.macroTargets.carbs}
          color={colors.glacier}
        />
        <MacroBar
          label='Fat'
          current={Math.round(totals.fat)}
          target={settings.macroTargets.fat}
          color={colors.sun}
        />
      </Card>
    </>
  );
}
