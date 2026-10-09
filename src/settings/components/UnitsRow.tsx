import React from 'react';

import { PillToggle, Row } from '@shared/components/ui';
import { Units } from '@shared/utils/units';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/hooks/useUnits';

const UNITS: readonly Units[] = [Units.Imperial, Units.Metric];

/** Pounds or kilograms (and the volume units that go with them), for display only. */
export function UnitsRow({ icon }: { icon?: React.ReactNode } = {}) {
  const { updateSettings } = useSettings();
  const { units } = useUnits();
  return (
    <Row
      title='Units'
      icon={icon}
      right={
        <PillToggle
          options={UNITS}
          value={units}
          onChange={(u) => updateSettings({ units: u })}
          label={(u) => (u === Units.Imperial ? 'lb' : 'kg')}
        />
      }
    />
  );
}
