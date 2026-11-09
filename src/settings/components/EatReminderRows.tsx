import React from 'react';

import { ReminderKey } from '../../domain/settings/models/reminderPlan';
import { useReminders } from '../hooks/useReminders';
import { ReminderBlock, ReminderTimeRow } from './ReminderBlock';

/**
 * Reminders to eat, for someone who doesn't track food: on or off, and the midday and
 * evening times. Nothing to log; like the others, they're quiet on rest days.
 */
export function EatReminderRows() {
  const { reminders, text, patch } = useReminders();
  const eat = reminders.eat;
  return (
    <ReminderBlock
      title='Reminders to eat'
      sub={eat.on ? text.eat : 'A gentle nudge to eat, with nothing to log'}
      on={eat.on}
      onToggle={(on) => patch(ReminderKey.Eat, { on })}
    >
      <ReminderTimeRow
        label='Midday'
        minutes={eat.midday}
        onChange={(midday) => patch(ReminderKey.Eat, { midday })}
      />
      <ReminderTimeRow
        label='Evening'
        minutes={eat.evening}
        onChange={(evening) => patch(ReminderKey.Eat, { evening })}
      />
    </ReminderBlock>
  );
}
