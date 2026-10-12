import React from 'react';

import { useReminders } from '@settings/hooks/useReminders';
import { ReminderBlock, ReminderTimeRow } from '@settings/components/ReminderBlock';
import { ReminderKey } from '@settings/models/reminderPlan';

/** The daily check-in reminder. Only offered while mood tracking is on. */
export function MoodReminderRows() {
  const { settings, reminders, text, patch } = useReminders();
  const mood = reminders.mood;
  if (!settings.trackMood) return null;
  return (
    <ReminderBlock
      title='Check-in reminder'
      sub={text.mood}
      on={mood.on}
      onToggle={(on) => patch(ReminderKey.Mood, { on })}
    >
      <ReminderTimeRow label='Time' minutes={mood.at} onChange={(at) => patch(ReminderKey.Mood, { at })} />
    </ReminderBlock>
  );
}
