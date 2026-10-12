import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { SettingsPage } from '@/settings/components/SettingsPage';
import { WaterSettingsRows } from '@/settings/water/components/WaterSettingsRows';
import { WaterReminderRows } from '@/settings/components/WaterReminderRows';

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
