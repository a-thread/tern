import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { SettingsPage } from '@/settings/components/SettingsPage/SettingsPage';
import { MoodSettingsRows } from '@/settings/mood/components/MoodSettingsRows/MoodSettingsRows';
import { MoodReminderRows } from '@/settings/components/MoodReminderRows/MoodReminderRows';

/** Settings › Mood and stress: the daily check-in, and its reminder. */
export default function MoodSettingsScreen() {
  const { settings } = useSettings();
  return (
    <SettingsPage title='Mood and stress'>
      <Group>
        <MoodSettingsRows />
      </Group>

      {settings.trackMood ? (
        <>
          <GroupLabel>Reminder</GroupLabel>
          <Group>
            <MoodReminderRows />
          </Group>
        </>
      ) : null}
    </SettingsPage>
  );
}
