import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui/Layout';
import { SettingsPage } from '@/settings/components/SettingsPage/SettingsPage';
import { CalorieTargetsRow } from '@/settings/food/components/CalorieTargetsRow/CalorieTargetsRow';
import { FoodDisplayRow } from '@/settings/food/components/FoodDisplayRow/FoodDisplayRow';
import { MealReminderRows } from '@/settings/components/MealReminderRows/MealReminderRows';
import { useSettingsNavigation } from '@/shared/navigation/useAppNavigation';

/** Settings › Food: targets, how food is shown, and the meal reminders. */
export default function FoodSettingsScreen() {
  const navigation = useSettingsNavigation();
  return (
    <SettingsPage title='Food'>
      <Group>
        <CalorieTargetsRow onPress={() => navigation.navigate('Targets')} />
        <FoodDisplayRow onPress={() => navigation.navigate('FoodDisplay')} />
      </Group>

      <GroupLabel>Reminders</GroupLabel>
      <Group>
        <MealReminderRows />
      </Group>
    </SettingsPage>
  );
}
