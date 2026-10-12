import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { SettingsPage } from '@/settings/components/SettingsPage';
import { WeightSettingsRows } from '@/settings/weight/components/WeightSettingsRows';
import { WeighInFrequencyRow } from '@/settings/weight/components/WeighInFrequencyRow';
import { WeightReminderRows } from '@/settings/components/WeightReminderRows';

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
