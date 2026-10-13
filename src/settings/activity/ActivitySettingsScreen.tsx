import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import { SettingsPage } from '../components/SettingsPage';
import { StepGoalRow } from './components/StepGoalRow';
import { RestDaysRow } from './components/RestDaysRow';
import { StreakReminderRows } from '../components/StreakReminderRows';
import { MovementSettingsRows } from './components/MovementSettingsRows';
import { useSettingsNavigation } from '../../navigation/useAppNavigation';

/** Settings › Steps and activity: the step goal, rest days, movement, and the streak alert. */
export default function ActivitySettingsScreen() {
  const navigation = useSettingsNavigation();
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
