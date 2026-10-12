import React from 'react';

import { Group, GroupLabel } from '../../shared/components/ui';
import { SettingsPage } from '../components/SettingsPage';
import { CalorieTargetsRow } from './components/CalorieTargetsRow';
import { FoodDisplayRow } from './components/FoodDisplayRow';
import { MealReminderRows } from '../components/MealReminderRows';
import { useSettingsNavigation } from '../../navigation/useAppNavigation';

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
