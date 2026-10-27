import { useEffect, useRef } from 'react';

import { useToast } from '@shared/state/ToastContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useActivity } from './domain/activity/ActivityContext';
import { useDoneToday } from './useDoneToday';
import { DayState } from '@shared/models/dayState';
import { useSettings } from './domain/settings/SettingsContext';
import {
  syncReminders,
  syncStreakAlerts,
  SyncResult,
} from './domain/settings/reminders';

/** Syncs scheduled reminders with settings. */
export function RemindersSync() {
  const { settings, ready, updateSettings } = useSettings();
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
    trackFood,
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
    trackFood,
  });
  const lastKey = useRef<string | null>(null);
  const anyOn =
    (trackFood && reminders.mealLog.on) ||
    (trackWeight && reminders.weighIn.on) ||
    (trackWater && reminders.water.on) ||
    (trackMood && reminders.mood.on) ||
    medications.some((m) => m.remind);

  // A new install doesn't schedule anything (which would ask to send notifications) until a
  // reminder is chosen: "Turn on reminders" in the wizard, or changing a reminder later on.
  const { onboarding } = settings;
  const waiting = !onboarding.wizardDone || !onboarding.notificationsAsked;
  const choiceKey = JSON.stringify({
    reminders,
    weighInFrequency,
    medications,
    trackWater,
    trackMood,
    trackWeight,
    trackFood,
  });
  const choiceWhenWaiting = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    // Choices made inside the wizard are its own business; its last screen asks or doesn't.
    if (!onboarding.wizardDone) {
      choiceWhenWaiting.current = null;
      return;
    }
    if (onboarding.notificationsAsked) return;
    if (choiceWhenWaiting.current === null) {
      choiceWhenWaiting.current = choiceKey;
      return;
    }
    if (choiceKey !== choiceWhenWaiting.current && anyOn) {
      updateSettings({
        onboarding: { ...onboarding, notificationsAsked: true },
      });
    }
  }, [ready, onboarding, choiceKey, anyOn, updateSettings]);

  useEffect(() => {
    // Wait until completion state is ready before scheduling.
    if (!ready || !doneReady || waiting) return;
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
        trackFood,
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
  }, [ready, doneReady, key, toast, waiting]);

  // Plan streak alerts only when steps are readable; clear them at the goal (by steps or by
  // movement) or on a rest day.
  const todayState = activity.days[activity.days.length - 1]?.state;
  const todayOpen =
    activity.stepsReadable &&
    !activity.todayIsRest &&
    todayState !== DayState.Goal;
  // An open day that ends under the goal becomes a rest day by itself while auto-detect has
  // allowance left, so no freeze is spent.
  const restCovers = settings.autoDetectRestDays && activity.restLeft > 0;
  useEffect(() => {
    if (!ready || !activity.ready) return;
    syncStreakAlerts({
      on: reminders.streak.on,
      streak: activity.streak,
      freezes: activity.freezes,
      todayOpen,
      restLeft: activity.restLeft,
      restCovers,
      movement: settings.trackMovement,
      now: new Date(),
    }).catch((e) => console.warn('Could not schedule streak alerts', e));
  }, [
    ready,
    activity.ready,
    reminders.streak.on,
    activity.streak,
    activity.freezes,
    activity.restLeft,
    todayOpen,
    restCovers,
    settings.trackMovement,
    today,
  ]);

  return null;
}
