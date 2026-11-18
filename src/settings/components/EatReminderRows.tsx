import React from 'react';

import { ReminderKey } from '../../domain/settings/models/reminderPlan';
import { useReminders } from '../hooks/useReminders';
import { ReminderBlock, ReminderTimeRow } from './ReminderBlock/ReminderBlock';

/** For someone who doesn't track food. */
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
