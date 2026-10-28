import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { healthAppName } from '@shared/utils/healthApp';
import { useSettings } from '../../domain/settings/SettingsContext';
import { useReminders } from '../hooks/useReminders';

/**
 * Streak notifications: an evening heads-up while today's goal is open, and a note the morning
 * after a freeze is used. They follow steps, so with reading steps off the row says so.
 */
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
