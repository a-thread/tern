import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { healthAppName } from '@shared/utils/healthApp';
import { useSettings } from '../../domain/settings/SettingsContext';
import { useReminders } from '../hooks/useReminders';

/** Says so when reading steps is off, since they follow steps. */
export function StreakReminderRows() {
  const { reminders, text, patch } = useReminders();
  const { settings } = useSettings();
  return (
    <ToggleRow
      title='Streak reminders'
      sub={
        settings.healthData.readSteps
          ? text.streak
          : `Needs steps from ${healthAppName()}, which are off in Health data`
      }
      on={reminders.streak.on}
      onToggle={(on) => patch('streak', { on })}
    />
  );
}
