import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { useReminders } from '@settings/hooks/useReminders';
import TimeStepperRow from '@settings/components/TimeStepperRow';
import { formatMinutes, Reminders, stepMinutes } from '@settings/models/reminderPlan';

/** The "log meals" reminder: on or off, and the midday and evening times. */
export function MealReminderRows() {
  const { reminders, text, patch } = useReminders();
  const meals = reminders.mealLog;
  return (
    <>
      <ToggleRow title='Log meals' sub={text.meals} on={meals.on} onToggle={(on) => patch('mealLog', { on })} />
      {meals.on ? (
        <>
          <TimeStepperRow
            label='Midday'
            value={formatMinutes(meals.midday)}
            onStep={(d) => patch('mealLog', { midday: stepMinutes(meals.midday, d * Reminders.STEP_MINUTES) })}
          />
          <TimeStepperRow
            label='Evening'
            value={formatMinutes(meals.evening)}
            onStep={(d) => patch('mealLog', { evening: stepMinutes(meals.evening, d * Reminders.STEP_MINUTES) })}
          />
        </>
      ) : null}
    </>
  );
}
