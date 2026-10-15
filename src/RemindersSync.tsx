import { useEffect, useRef } from 'react';

import { useToast } from '@shared/state/ToastContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useActivity } from './domain/activity/ActivityContext';
import { useDoneToday } from './useDoneToday';
import { StepsStatus } from './domain/activity/models/stepsStatus';
import { useSettings } from './domain/settings/SettingsContext';
import {
  syncReminders,
  syncStreakAlerts,
  SyncResult,
} from './domain/settings/reminders';

/** Syncs scheduled reminders with settings. */
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
  // Completed goals stay quiet until undone or a new day begins.
  const { done, ready: doneReady } = useDoneToday();
  // Reschedule when reminder settings or today's completion state changes.
  const key = JSON.stringify({
    today,
    done,
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
    // Wait until completion state is ready before scheduling.
    if (!ready || !doneReady) return;
    if (key === lastKey.current) return;
    const firstRun = lastKey.current === null;
    lastKey.current = key;

    syncReminders(
      reminders,
      {
        weighInFrequency,
        medications,
        trackWater,
        trackMood,
        trackWeight,
      },
      done,
    )
      .then((result) => {
        if (result === SyncResult.Denied && anyOn && !firstRun) {
          toast.show(
            'Notifications are off for Tern — turn them on in system settings.',
          );
        }
      })
      .catch((e) => console.warn('Could not schedule reminders', e));
    // `key` captures all reminder fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, doneReady, key, toast]);

  // Plan streak alerts only when steps are readable; clear them at the goal or on rest days.
  const stepsReadable =
    activity.status === StepsStatus.Connected && settings.healthData.readSteps;
  // Use the chosen rest day to avoid flicker when movement reaches the goal.
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
