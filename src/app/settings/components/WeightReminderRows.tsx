import React from 'react';

import { useReminders } from '../hooks/useReminders';
import TimeStepperRow from './TimeStepperRow';
import {
  ReminderBlock,
  ReminderTimeRow,
} from './ReminderBlock';
import {
  stepWeekday,
  weekdayPlural,
  ReminderKey,
} from '../../domain/settings/models/reminderPlan';
import { Frequency } from '../../shared/models/frequency';

/** The weigh-in reminder, on the day and time it fires. Only offered while weight is tracked. */
export function WeightReminderRows() {
  const { settings, reminders, text, patch } = useReminders();
  const weighIn = reminders.weighIn;
  if (!settings.trackWeight) return null;
  return (
    <ReminderBlock
      title='Weigh-in reminder'
      sub={text.weighIn}
      on={weighIn.on}
      onToggle={(on) => patch(ReminderKey.WeighIn, { on })}
    >
      {settings.weighInFrequency === Frequency.Weekly ? (
        <TimeStepperRow
          key='day'
          label='Day'
          value={weekdayPlural(weighIn.weekday)}
          onStep={(d) =>
            patch(ReminderKey.WeighIn, {
              weekday: stepWeekday(weighIn.weekday, d),
            })
          }
        />
      ) : null}
      <ReminderTimeRow
        key='time'
        label='Time'
        minutes={weighIn.at}
        onChange={(at) => patch(ReminderKey.WeighIn, { at })}
      />
    </ReminderBlock>
  );
}
