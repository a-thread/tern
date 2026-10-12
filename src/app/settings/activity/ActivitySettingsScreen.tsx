import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui';
import { SettingsPage } from '@/settings/components/SettingsPage/SettingsPage';
import { StepGoalRow } from '@/settings/activity/components/StepGoalRow/StepGoalRow';
import { RestDaysRow } from '@/settings/activity/components/RestDaysRow/RestDaysRow';
import { StreakReminderRows } from '@/settings/components/StreakReminderRows/StreakReminderRows';
import { MovementSettingsRows } from '@/settings/activity/components/MovementSettingsRows/MovementSettingsRows';
import { useSettingsNavigation } from '@/navigation/useAppNavigation';

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
