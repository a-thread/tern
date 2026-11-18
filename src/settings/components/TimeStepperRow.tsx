import React from 'react';

import { Stepper } from '@shared/components/ui';
import { SettingsSubRow } from './SettingsSubRow/SettingsSubRow';

/** A labelled row with a − / + stepper around a value, for times and days. */
export default function TimeStepperRow({
  label,
  value,
  onStep,
  nested = true,
}: {
  label: string;
  value: string;
  onStep: (direction: 1 | -1) => void;
  /** Indent under a reminder's toggle (default). */
  nested?: boolean;
}) {
  return (
    <SettingsSubRow label={label} nested={nested}>
      <Stepper
        value={value}
        onDecrement={() => onStep(-1)}
        onIncrement={() => onStep(1)}
        decrementLabel={`Earlier ${label}`}
        incrementLabel={`Later ${label}`}
        valueMinWidth={78}
      />
    </SettingsSubRow>
  );
}
