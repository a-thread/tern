import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import { SettingsPage } from '@settings/components/SettingsPage';
import { StepGoalRow } from '@today/components/StepGoalRow';
import { RestDaysRow } from '@today/components/RestDaysRow';
import { StreakReminderRows } from '@today/components/StreakReminderRows';
import { MovementSettingsRows } from '@movement/components/MovementSettingsRows';
import { useSettingsNavigation } from '@shared/navigation/useAppNavigation';

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
