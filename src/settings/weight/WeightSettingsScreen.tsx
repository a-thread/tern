import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import { useSettings } from '../../domain/settings/SettingsContext';
import { SettingsPage } from '../components/SettingsPage';
import { WeightSettingsRows } from './components/WeightSettingsRows';
import { WeighInFrequencyRow } from './components/WeighInFrequencyRow';
import { WeightReminderRows } from '../components/WeightReminderRows';

/** Settings › Weight: tracking, the goal, how often to weigh in, and the reminder. */
export default function WeightSettingsScreen() {
  const { settings } = useSettings();
  return (
    <SettingsPage title='Weight'>
      <Group>
        <WeightSettingsRows />
        {settings.trackWeight ? <WeighInFrequencyRow /> : null}
      </Group>

      {settings.trackWeight ? (
        <>
          <GroupLabel>Reminder</GroupLabel>
          <Group>
            <WeightReminderRows />
          </Group>
        </>
      ) : null}
    </SettingsPage>
  );
}
