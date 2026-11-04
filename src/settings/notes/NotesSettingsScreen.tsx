import React from 'react';

import { FootNote, Group, ToggleRow } from '@shared/components/ui';
import { useSettings } from '../../domain/settings/SettingsContext';
import { SettingsPage } from '../components/SettingsPage';

/** Settings › Notes: whether Today offers a note for the day. Turning it off keeps what was written. */
export default function NotesSettingsScreen() {
  const { settings, updateSettings } = useSettings();
  return (
    <SettingsPage title='Notes'>
      <Group>
        <ToggleRow
          title='Notes'
          sub='A few words about your day, from Today'
          on={settings.trackNotes}
          onToggle={(v) => updateSettings({ trackNotes: v })}
        />
      </Group>
      <FootNote>
        Turning notes off hides them from Today and Trends. Notes you have
        written are kept, and come back if you turn them on again.
      </FootNote>
    </SettingsPage>
  );
}
