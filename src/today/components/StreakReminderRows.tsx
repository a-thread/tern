import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { useReminders } from '@settings/hooks/useReminders';

/** Streak notifications: an evening heads-up, and a note the morning after a streak ends or a freeze is used. */
export function StreakReminderRows() {
  const { reminders, text, patch } = useReminders();
  return (
    <ToggleRow
      title='Streak alerts'
      sub={text.streak}
      on={reminders.streak.on}
      onToggle={(on) => patch('streak', { on })}
    />
  );
}
