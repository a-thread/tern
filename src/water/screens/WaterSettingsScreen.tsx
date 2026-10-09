import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { SettingsPage } from '@settings/components/SettingsPage';
import { WaterSettingsRows } from '@water/components/WaterSettingsRows';
import { WaterReminderRows } from '@water/components/WaterReminderRows';

/** Settings › Water: tracking, the daily goal, and the reminder. */
export default function WaterSettingsScreen() {
  const { settings } = useSettings();
  return (
    <SettingsPage title='Water'>
      <Group>
        <WaterSettingsRows />
      </Group>

      {settings.trackWater ? (
        <>
          <GroupLabel>Reminder</GroupLabel>
          <Group>
            <WaterReminderRows />
          </Group>
        </>
      ) : null}
    </SettingsPage>
  );
}
