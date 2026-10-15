import React from 'react';

import { Stepper } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { nudgeZone } from '@/domain/food/models/intakeZone';
import { type CalorieZone } from '@/domain/settings/models/calorieZone';

/** One end of the calorie zone, stepped in tens; the zone keeps its minimum gap. */
export function ZoneStepper({ end, zone }: { end: 'min' | 'max'; zone: CalorieZone }) {
  const { updateSettings } = useSettings();
  const label = end === 'min' ? 'minimum' : 'maximum';
  return (
    <Stepper
      value={zone[end].toLocaleString()}
      valueMinWidth={56}
      decrementLabel={`Lower the zone ${label}`}
      incrementLabel={`Raise the zone ${label}`}
      onDecrement={() => updateSettings({ calorieZone: nudgeZone(zone, end, -1) })}
      onIncrement={() => updateSettings({ calorieZone: nudgeZone(zone, end, 1) })}
    />
  );
}
