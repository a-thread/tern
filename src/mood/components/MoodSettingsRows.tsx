import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** Whether the daily mood and stress check-in is switched on. */
export function MoodSettingsRows() {
  const { settings, updateSettings } = useSettings();
  return (
    <ToggleRow
      title='Track mood and stress'
      sub='Optional. A quick daily check-in from Today'
      on={settings.trackMood}
      onToggle={(v) => updateSettings({ trackMood: v })}
    />
  );
}
