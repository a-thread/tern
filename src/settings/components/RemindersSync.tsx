import { useEffect, useRef } from 'react';

import { useToast } from '@shared/state/ToastContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useActivity } from '@today/ActivityContext';
import { StepsStatus } from '@today/data/steps.repository';
import { useSettings } from '@settings/SettingsContext';
import { syncReminders, syncStreakAlerts, SyncResult } from '@settings/data/reminders';

/** Keeps the device's scheduled reminders in step with the Settings toggles. Renders nothing. */
export function RemindersSync() {
  const { settings, ready } = useSettings();
  const toast = useToast();
  const today = useDayKey();
  const activity = useActivity();
  const {
    reminders,
    weighInFrequency,
    medications,
    trackWater,
    trackMood,
    trackWeight,
  } = settings;
  // Reschedule when a toggle, a time, the weigh-in frequency or a medication reminder changes.
  // The day is part of it: meal reminders are scheduled day by day, so a new day tops them up.
  const key = JSON.stringify({
    today,
    reminders,
    weighInFrequency,
    medications,
    trackWater,
    trackMood,
    trackWeight,
  });
  const lastKey = useRef<string | null>(null);
  const anyOn =
    reminders.mealLog.on ||
    (trackWeight && reminders.weighIn.on) ||
    (trackWater && reminders.water.on) ||
    (trackMood && reminders.mood.on) ||
    medications.some((m) => m.remind);

  useEffect(() => {
    if (!ready) return;
    if (key === lastKey.current) return;
    const firstRun = lastKey.current === null;
    lastKey.current = key;

    syncReminders(reminders, {
      weighInFrequency,
      medications,
      trackWater,
      trackMood,
      trackWeight,
    })
      .then((result) => {
        if (result === SyncResult.Denied && anyOn && !firstRun) {
          toast.show(
            'Notifications are off for Tern — turn them on in system settings.',
          );
        }
      })
      .catch((e) => console.warn('Could not schedule reminders', e));
    // `key` captures every field of `reminders`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, toast]);

  // Streak alerts follow today's steps, so they're re-planned whenever those change: once the
  // goal is reached (or a rest day taken) they're cleared. They're only offered while steps can
  // actually be read, otherwise "not reached yet" would just mean "not seen yet".
  const stepsReadable =
    activity.status === StepsStatus.Connected && settings.healthData.readSteps;
  const todayOpen =
    stepsReadable &&
    !activity.todayIsRest &&
    activity.todaySteps < settings.stepGoal;
  useEffect(() => {
    if (!ready || !activity.ready) return;
    syncStreakAlerts({
      on: reminders.streak.on,
      streak: activity.streak,
      freezes: activity.freezes,
      todayOpen,
      now: new Date(),
    }).catch((e) => console.warn('Could not schedule streak alerts', e));
  }, [
    ready,
    activity.ready,
    reminders.streak.on,
    activity.streak,
    activity.freezes,
    todayOpen,
    today,
  ]);

  return null;
}
