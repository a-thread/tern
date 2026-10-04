import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { useReminders } from '@settings/hooks/useReminders';
import TimeStepperRow from '@settings/components/TimeStepperRow';
import { formatMinutes, Reminders, stepMinutes } from '@settings/models/reminderPlan';

/** The daily check-in reminder. Only offered while mood tracking is on. */
export function MoodReminderRows() {
  const { settings, reminders, text, patch } = useReminders();
  const mood = reminders.mood;
  if (!settings.trackMood) return null;
  return (
    <>
      <ToggleRow title='Check in' sub={text.mood} on={mood.on} onToggle={(on) => patch('mood', { on })} />
      {mood.on ? (
        <TimeStepperRow
          label='Time'
          value={formatMinutes(mood.at)}
          onStep={(d) => patch('mood', { at: stepMinutes(mood.at, d * Reminders.STEP_MINUTES) })}
        />
      ) : null}
    </>
  );
}
