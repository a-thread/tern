import React from 'react';

import { PillToggle, Row, ToggleRow } from '@shared/components/ui';
import { useReminders } from '@settings/hooks/useReminders';
import TimeStepperRow from '@settings/components/TimeStepperRow';
import { formatMinutes, Reminders, stepMinutes, stepWeekday, weekdayPlural, ReminderKey } from '@settings/models/reminderPlan';
import { Frequency } from '@shared/models/frequency';

const FREQUENCIES = [Frequency.Daily, Frequency.Weekly];

/** How often to weigh in, and the weigh-in reminder. Only offered while weight is tracked. */
export function WeightReminderRows() {
  const { settings, updateSettings, reminders, text, patch } = useReminders();
  const weighIn = reminders.weighIn;
  if (!settings.trackWeight) return null;
  return (
    <>
      <Row
        title='Weigh in'
        sub={
          settings.weighInFrequency === Frequency.Daily
            ? 'Today asks for a weight every day'
            : 'Today asks once a week'
        }
        right={
          <PillToggle
            options={FREQUENCIES}
            value={settings.weighInFrequency}
            onChange={(f) => updateSettings({ weighInFrequency: f })}
            label={(f) => (f === Frequency.Daily ? 'Daily' : 'Weekly')}
          />
        }
      />
      <ToggleRow
        title='Weigh-in reminder'
        sub={text.weighIn}
        on={weighIn.on}
        onToggle={(on) => patch(ReminderKey.WeighIn, { on })}
      />
      {weighIn.on ? (
        <>
          {settings.weighInFrequency === Frequency.Weekly ? (
            <TimeStepperRow
              label='Day'
              value={weekdayPlural(weighIn.weekday)}
              onStep={(d) => patch(ReminderKey.WeighIn, { weekday: stepWeekday(weighIn.weekday, d) })}
            />
          ) : null}
          <TimeStepperRow
            label='Time'
            value={formatMinutes(weighIn.at)}
            onStep={(d) => patch(ReminderKey.WeighIn, { at: stepMinutes(weighIn.at, d * Reminders.STEP_MINUTES) })}
          />
        </>
      ) : null}
    </>
  );
}
