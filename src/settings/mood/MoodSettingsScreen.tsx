import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import { useSettings } from '../../domain/settings/SettingsContext';
import { SettingsPage } from '../components/SettingsPage';
import { MoodSettingsRows } from './components/MoodSettingsRows';
import { MoodReminderRows } from '../components/MoodReminderRows';

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
