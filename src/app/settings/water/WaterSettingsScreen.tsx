import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui/Layout';
import { useSettings } from '@/domain/settings/SettingsContext';
import { SettingsPage } from '@/settings/components/SettingsPage/SettingsPage';
import { WaterSettingsRows } from '@/settings/water/components/WaterSettingsRows/WaterSettingsRows';
import { WaterReminderRows } from '@/settings/components/WaterReminderRows/WaterReminderRows';

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
