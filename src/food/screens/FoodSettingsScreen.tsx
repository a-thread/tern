import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Group, GroupLabel } from '@shared/components/ui';
import type { SettingsStackParamList } from '@shared/navigation/types';
import { SettingsPage } from '@settings/components/SettingsPage';
import { CalorieTargetsRow } from '@food/components/CalorieTargetsRow';
import { FoodDisplayRow } from '@food/components/FoodDisplayRow';
import { MealReminderRows } from '@food/components/MealReminderRows';

/** Settings › Food: targets, how food is shown, and the meal reminders. */
export default function FoodSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
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
