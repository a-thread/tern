import React from 'react';

import { Divider, Row, Stepper, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { clampMovementGoal, MovementLimits } from '@movement/models/movementEntry';

/** Whether movement is tracked, and how many minutes make a goal day. */
export function MovementSettingsRows() {
  const { settings, updateSettings } = useSettings();
  const step = (dir: 1 | -1) =>
    updateSettings({
      movementGoalMinutes: clampMovementGoal(settings.movementGoalMinutes + dir * MovementLimits.STEP),
    });
  return (
    <>
      <ToggleRow
        title='Track movement'
        sub='Swims, rides, lifting, classes: no calories, just minutes'
        on={settings.trackMovement}
        onToggle={(v) => updateSettings({ trackMovement: v })}
      />
      {settings.trackMovement ? (
        <>
          <Divider />
          <Row
            title='Counts as a goal day'
            sub={`At ${settings.movementGoalMinutes} minutes, even if steps fall short. Walks and runs are already in your steps`}
            right={
              <Stepper
                value={settings.movementGoalMinutes}
                valueMinWidth={36}
                decrementLabel='Fewer minutes'
                incrementLabel='More minutes'
                onDecrement={() => step(-1)}
                onIncrement={() => step(1)}
              />
            }
          />
        </>
      ) : null}
    </>
  );
}
