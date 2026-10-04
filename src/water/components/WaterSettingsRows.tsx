import React from 'react';

import { Divider, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/hooks/useUnits';
import TimeStepperRow from '@settings/components/TimeStepperRow';
import { clampWaterGoal } from '@water/models/waterEntry';

/** Whether water is tracked, and the daily goal. */
export function WaterSettingsRows() {
  const { settings, updateSettings } = useSettings();
  const { formatVolume, stepWaterGoal } = useUnits();
  return (
    <>
      <ToggleRow
        title='Track water'
        sub='Log drinks from the Food tab'
        on={settings.trackWater}
        onToggle={(v) => updateSettings({ trackWater: v })}
      />
      {settings.trackWater ? (
        <>
          <Divider />
          <TimeStepperRow
            label='Daily goal'
            value={formatVolume(settings.waterGoalOz)}
            onStep={(d) =>
              updateSettings({ waterGoalOz: clampWaterGoal(stepWaterGoal(settings.waterGoalOz, d)) })
            }
          />
        </>
      ) : null}
    </>
  );
}
