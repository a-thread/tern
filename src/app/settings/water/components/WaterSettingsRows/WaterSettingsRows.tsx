import React from 'react';

import { Divider } from '@/shared/components/ui/Layout';
import { ToggleRow } from '@/shared/components/ui/Toggle';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import TimeStepperRow from '@/settings/components/TimeStepperRow/TimeStepperRow';
import { clampWaterGoal } from '@/domain/water/models/waterEntry';

/** Whether water is tracked, and the daily goal. */
export function WaterSettingsRows() {
  const { settings, updateSettings } = useSettings();
  const { formatVolume, stepWaterGoal } = useUnits();
  return (
    <>
      <ToggleRow
        title='Track water'
        sub='Log drinks from Today or the Food tab'
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
