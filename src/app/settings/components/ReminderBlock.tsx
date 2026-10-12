import React from 'react';

import { Divider, ToggleRow } from '@/shared/components/ui';
import TimeStepperRow from '@/settings/components/TimeStepperRow';
import {
  formatMinutes,
  Reminders,
  stepMinutes,
} from '@/domain/settings/models/reminderPlan';

/** A reminder's on/off row, with its settings rows (divider-separated) shown only while it's on. */
export function ReminderBlock({
  title,
  sub,
  on,
  onToggle,
  children,
}: {
  title: string;
  sub: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  children?: React.ReactNode;
}) {
  const rows = React.Children.toArray(children);
  return (
    <>
      <ToggleRow title={title} sub={sub} on={on} onToggle={onToggle} />
      {on
        ? rows.map((row, i) => (
            <React.Fragment
              key={React.isValidElement(row) && row.key !== null ? row.key : i}
            >
              <Divider />
              {row}
            </React.Fragment>
          ))
        : null}
    </>
  );
}

/** A time-of-day row stepping by the reminder step, wrapping past midnight. */
export function ReminderTimeRow({
  label,
  minutes,
  onChange,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  return (
    <TimeStepperRow
      label={label}
      value={formatMinutes(minutes)}
      onStep={(d) => onChange(stepMinutes(minutes, d * Reminders.STEP_MINUTES))}
    />
  );
}
