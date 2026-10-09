import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Group, GroupLabel } from '@shared/components/ui';
import type { SettingsStackParamList } from '@shared/navigation/types';
import { SettingsPage } from '@settings/components/SettingsPage';
import { StepGoalRow } from '@today/components/StepGoalRow';
import { RestDaysRow } from '@today/components/RestDaysRow';
import { StreakReminderRows } from '@today/components/StreakReminderRows';
import { MovementSettingsRows } from '@movement/components/MovementSettingsRows';

/** Settings › Steps and activity: the step goal, rest days, movement, and the streak alert. */
export default function ActivitySettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  return (
    <SettingsPage title='Steps and activity'>
      <GroupLabel>Steps</GroupLabel>
      <Group>
        <StepGoalRow onPress={() => navigation.navigate('StepGoal')} />
        <RestDaysRow onPress={() => navigation.navigate('RestDays')} />
      </Group>

      <GroupLabel>Movement</GroupLabel>
      <Group>
        <MovementSettingsRows />
      </Group>

      <GroupLabel>Reminder</GroupLabel>
      <Group>
        <StreakReminderRows />
      </Group>
    </SettingsPage>
  );
}
