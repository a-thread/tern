import { useState } from 'react';

import { useActivity } from '@/domain/activity/ActivityContext';
import { StepsStatus } from '@/domain/activity/models/stepsStatus';
import { useMovement } from '@/domain/movement/MovementContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useToast } from '../state/ToastContext';
import { healthAppName } from '../utils/healthApp';

/**
 * Asks for access to steps (the health app's permission prompt), and to workouts when they
 * count as movement, and says how it went. Shared by Settings › Health data and the setup wizard.
 */
export function useConnectHealth() {
  const { settings } = useSettings();
  const movement = useMovement();
  const { connect } = useActivity();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const healthApp = healthAppName();

  const requestAccess = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await connect();
      const wantsWorkouts =
        settings.trackMovement &&
        settings.healthData.readWorkouts &&
        movement.workoutsAvailable;
      const workoutsAllowed =
        result !== StepsStatus.Connected ||
        !wantsWorkouts ||
        (await movement.connectWorkouts());
      toast.show(
        result === StepsStatus.Connected
          ? workoutsAllowed
            ? `${healthApp} is connected.`
            : `${healthApp} is connected. Allow Tern to read workouts in ${healthApp} to count them.`
          : result === StepsStatus.Unavailable
            ? `${healthApp} isn't available on this device.`
            : 'Tern still needs permission to read your steps.',
      );
    } catch (e) {
      console.warn(`Could not connect ${healthApp}`, e);
      toast.show(`Couldn't connect ${healthApp} — please try again.`);
    } finally {
      setBusy(false);
    }
  };

  return { busy, requestAccess };
}
