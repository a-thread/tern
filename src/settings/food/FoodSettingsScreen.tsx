import React from 'react';

import { FootNote, Group, GroupLabel } from '@shared/components/ui';
import { SettingsPage } from '../components/SettingsPage';
import { CalorieTargetsRow } from './components/CalorieTargetsRow';
import { FoodDisplayRow } from './components/FoodDisplayRow';
import { MealCheckInToggleRow } from './components/MealCheckInToggleRow';
import { MealReminderRows } from '../components/MealReminderRows';
import { useSettingsNavigation } from '../../navigation/useAppNavigation';

/** Settings › Food: targets, how food is shown, the check-in after meals, and the meal reminders. */
export default function FoodSettingsScreen() {
  const navigation = useSettingsNavigation();
  return (
    <SettingsPage title='Food'>
      <Group>
        <CalorieTargetsRow onPress={() => navigation.navigate('Targets')} />
        <FoodDisplayRow onPress={() => navigation.navigate('FoodDisplay')} />
      </Group>

      <GroupLabel>After meals</GroupLabel>
      <Group>
        <MealCheckInToggleRow />
      </Group>
      <FootNote>
        Each meal on the Food page gets a check-in once it has food in it. It is
        only for you to look back on, and never affects waypoints.
      </FootNote>

      <GroupLabel>Reminders</GroupLabel>
      <Group>
        <MealReminderRows />
      </Group>
    </SettingsPage>
  );
}
