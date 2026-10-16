import React from 'react';

import { Divider, Row, Stepper, ToggleRow } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { healthAppName } from '@shared/utils/healthApp';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useMovement } from '@/domain/movement/MovementContext';
import {
  clampMovementGoal,
  MovementGoal,
} from '@/domain/settings/models/movementGoal';

/** Whether movement is tracked, and how many minutes make a goal day. */
export function MovementSettingsRows() {
  const { settings, updateSettings } = useSettings();
  const movement = useMovement();
  const toast = useToast();
  /** Turning movement on also asks to read workouts, when they count as movement. */
  const toggle = async (v: boolean) => {
    updateSettings({ trackMovement: v });
    if (!v || !settings.healthData.readWorkouts || !movement.workoutsAvailable)
      return;
    if (!(await movement.connectWorkouts())) {
      toast.show(
        `Allow Tern to read workouts in ${healthAppName()} to count them.`,
      );
    }
  };
  const step = (dir: 1 | -1) =>
    updateSettings({
      movementGoalMinutes: clampMovementGoal(
        settings.movementGoalMinutes + dir * MovementGoal.STEP,
      ),
    });
  return (
    <>
      <ToggleRow
        title='Track movement'
        sub='Swims, rides, lifting, classes: no calories, just minutes'
        on={settings.trackMovement}
        onToggle={toggle}
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
