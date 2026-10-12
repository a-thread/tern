import React from 'react';

import { useReminders } from '@/settings/hooks/useReminders';
import { ReminderBlock, ReminderTimeRow } from '@/settings/components/ReminderBlock/ReminderBlock';

/** The meal reminders: on or off, and the midday and evening times. */
export function MealReminderRows() {
  const { reminders, text, patch } = useReminders();
  const meals = reminders.mealLog;
  return (
    <ReminderBlock
      title='Meal reminders'
      sub={text.meals}
      on={meals.on}
      onToggle={(on) => patch('mealLog', { on })}
    >
      <ReminderTimeRow label='Midday' minutes={meals.midday} onChange={(midday) => patch('mealLog', { midday })} />
      <ReminderTimeRow label='Evening' minutes={meals.evening} onChange={(evening) => patch('mealLog', { evening })} />
    </ReminderBlock>
  );
}
