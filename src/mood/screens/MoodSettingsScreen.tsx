import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { SettingsPage } from '@settings/components/SettingsPage';
import { MoodSettingsRows } from '@mood/components/MoodSettingsRows';
import { MoodReminderRows } from '@mood/components/MoodReminderRows';

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
