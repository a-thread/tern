import React from 'react';

import { Divider, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import TimeStepperRow from '../../components/TimeStepperRow';
import { clampWaterGoal } from '@/domain/settings/models/waterGoal';

/** Whether water is tracked, and the daily goal. */
export function WaterSettingsRows() {
  const { settings, updateSettings } = useSettings();
  const { formatVolume, stepWaterGoal } = useUnits();
  return (
    <>
      <ToggleRow
        title='Track water'
        sub={
          settings.trackFood
            ? 'Log drinks from Today or the Food tab'
            : 'Log drinks from Today'
        }
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
              updateSettings({
                waterGoalOz: clampWaterGoal(
                  stepWaterGoal(settings.waterGoalOz, d),
                ),
              })
            }
          />
        </>
      ) : null}
    </>
  );
}
