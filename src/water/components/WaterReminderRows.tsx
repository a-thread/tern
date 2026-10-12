import React from 'react';

import { useReminders } from '@settings/hooks/useReminders';
import TimeStepperRow from '@settings/components/TimeStepperRow';
import { ReminderBlock } from '@settings/components/ReminderBlock';
import { formatMinutes, Reminders, ReminderKey } from '@settings/models/reminderPlan';

const LAST_HOUR = 23 * 60;
const clampMinutes = (minutes: number) => Math.min(Math.max(minutes, 0), LAST_HOUR);

/** The water reminder: the window it runs in and how often. Only offered while water is tracked. */
export function WaterReminderRows() {
  const { settings, reminders, text, patch } = useReminders();
  const water = reminders.water;
  if (!settings.trackWater) return null;
  return (
    <ReminderBlock
      title='Water reminder'
      sub={text.water}
      on={water.on}
      onToggle={(on) => patch(ReminderKey.Water, { on })}
    >
      <TimeStepperRow
        label='From'
        value={formatMinutes(water.start)}
        onStep={(d) => {
          const start = clampMinutes(water.start + d * 60);
          patch(ReminderKey.Water, { start, end: Math.max(water.end, start) });
        }}
      />
      <TimeStepperRow
        label='Until'
        value={formatMinutes(water.end)}
        onStep={(d) => {
          const end = clampMinutes(water.end + d * 60);
          patch(ReminderKey.Water, { end, start: Math.min(water.start, end) });
        }}
      />
      <TimeStepperRow
        label='Every'
        value={water.everyHours === 1 ? '1 hour' : `${water.everyHours} hours`}
        onStep={(d) =>
          patch(ReminderKey.Water, {
            everyHours: Math.min(
              Math.max(water.everyHours + d, Reminders.WATER_EVERY_HOURS.min),
              Reminders.WATER_EVERY_HOURS.max,
            ),
          })
        }
      />
    </ReminderBlock>
  );
}
