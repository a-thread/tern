import { useEffect, useRef } from 'react';

import { useToast } from '@shared/state/ToastContext';
import { useSettings } from './SettingsContext';
import { syncReminders } from './reminders';

/** Keeps the device's scheduled reminders in step with the Settings toggles. Renders nothing. */
export function RemindersSync() {
  const { settings, ready } = useSettings();
  const toast = useToast();
  const { reminders, weighInFrequency, medications, trackWater } = settings;
  // Reschedule when a toggle, a time, the weigh-in frequency or a medication reminder changes.
  const key = JSON.stringify({ reminders, weighInFrequency, medications, trackWater });
  const lastKey = useRef<string | null>(null);
  const anyOn =
    reminders.mealLog.on ||
    reminders.weighIn.on ||
    (trackWater && reminders.water.on) ||
    medications.some((m) => m.remind);

  useEffect(() => {
    if (!ready) return;
    if (key === lastKey.current) return;
    const firstRun = lastKey.current === null;
    lastKey.current = key;

    syncReminders(reminders, { weighInFrequency, medications, trackWater })
      .then((result) => {
        if (result === 'denied' && anyOn && !firstRun) {
          toast.show('Notifications are off for Tern — turn them on in system settings.');
        }
      })
      .catch((e) => console.warn('Could not schedule reminders', e));
    // `key` captures every field of `reminders`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, toast]);

  return null;
}
