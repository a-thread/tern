import { useEffect, useRef } from 'react';

import { useToast } from '@shared/state/ToastContext';
import { useSettings } from './SettingsContext';
import { syncReminders } from './reminders';

/** Keeps the device's scheduled reminders in step with the Settings toggles. Renders nothing. */
export function RemindersSync() {
  const { settings, ready } = useSettings();
  const toast = useToast();
  const meals = settings.reminders.mealLog.on;
  const weighIn = settings.reminders.weeklyWeighIn.on;
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const key = `${meals}|${weighIn}`;
    if (key === lastKey.current) return;
    const firstRun = lastKey.current === null;
    lastKey.current = key;

    syncReminders({ meals, weighIn })
      .then((result) => {
        if (result === 'denied' && !firstRun) {
          toast.show('Notifications are off for Tern — turn them on in system settings.');
        }
      })
      .catch((e) => console.warn('Could not schedule reminders', e));
  }, [ready, meals, weighIn, toast]);

  return null;
}
