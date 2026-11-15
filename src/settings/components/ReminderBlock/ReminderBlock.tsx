import React from 'react';

import { Divider, ToggleRow } from '@shared/components/ui';
import TimeOfDayRow from './components/TimeOfDayRow/TimeOfDayRow';
import { Reminders } from '@/domain/settings/models/reminderPlan';

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

/** A reminder's time of day: hour, minutes (by the reminder step) and am / pm. */
export function ReminderTimeRow({
  label,
  minutes,
  onChange,
  nested,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  /** False for a row of its own rather than under a reminder's on/off row. */
  nested?: boolean;
}) {
  return (
    <TimeOfDayRow
      label={label}
      nested={nested}
      minutes={minutes}
      onChange={onChange}
      minuteStep={Reminders.STEP_MINUTES}
    />
  );
}
