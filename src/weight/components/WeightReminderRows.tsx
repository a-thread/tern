import React from 'react';

import { Divider, ToggleRow } from '@shared/components/ui';
import { useReminders } from '@settings/hooks/useReminders';
import TimeStepperRow from '@settings/components/TimeStepperRow';
import {
  formatMinutes,
  Reminders,
  stepMinutes,
  stepWeekday,
  weekdayPlural,
  ReminderKey,
} from '@settings/models/reminderPlan';
import { Frequency } from '@shared/models/frequency';

/** The weigh-in reminder, on the day and time it fires. Only offered while weight is tracked. */
export function WeightReminderRows() {
  const { settings, reminders, text, patch } = useReminders();
  const weighIn = reminders.weighIn;
  if (!settings.trackWeight) return null;
  return (
    <>
      <ToggleRow
        title='Weigh-in reminder'
        sub={text.weighIn}
        on={weighIn.on}
        onToggle={(on) => patch(ReminderKey.WeighIn, { on })}
      />
      {weighIn.on ? (
        <>
          {settings.weighInFrequency === Frequency.Weekly ? (
            <>
              <Divider />
              <TimeStepperRow
                label='Day'
                value={weekdayPlural(weighIn.weekday)}
                onStep={(d) =>
                  patch(ReminderKey.WeighIn, {
                    weekday: stepWeekday(weighIn.weekday, d),
                  })
                }
              />
            </>
          ) : null}
          <Divider />
          <TimeStepperRow
            label='Time'
            value={formatMinutes(weighIn.at)}
            onStep={(d) =>
              patch(ReminderKey.WeighIn, {
                at: stepMinutes(weighIn.at, d * Reminders.STEP_MINUTES),
              })
            }
          />
        </>
      ) : null}
    </>
  );
}
