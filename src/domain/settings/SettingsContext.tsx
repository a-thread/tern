import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SettingsRepository } from './settings.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { recordGoalChange } from './models/stepGoalHistory';
import { mergeMedications } from './models/medication';
import { clampWaterGoal, WaterGoal } from './models/waterGoal';
import { mergeReminders, Reminders } from './models/reminderPlan';
import {
  initialSettings,
  changesAnything,
  type AppSettings,
} from './models/appSettings';
import { Frequency } from '@shared/models/frequency';
import { sanitizeCalorieZone } from './models/calorieZone';
import { clampMovementGoal } from './models/movementGoal';
import { Aim } from './models/aim';
import { JourneyView } from './models/journeyView';
import { loadOnboarding, Onboarding } from './models/onboarding';

type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const [SettingsContext, useSettings] =
  createRequiredContext<SettingsContextValue>(
    'useSettings',
    'SettingsProvider',
  );
export { useSettings };

/** `defaults` is what anything never saved starts as (`phoneSettings` on the phone). */
export function SettingsProvider({
  repo,
  defaults = initialSettings,
  children,
}: {
  repo: SettingsRepository;
  defaults?: AppSettings;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [ready, setReady] = useState(false);
  const latest = useRef(settings);
  latest.current = settings;
  // Sign-up stores the first name in auth metadata (no session, so no settings
  // row, until the email is confirmed); the first load copies it across.
  const signedUpName = useAuth()?.session?.user.user_metadata?.first_name;
  const signedUpNameRef = useRef<string | undefined>(signedUpName);
  signedUpNameRef.current = signedUpName;

  // Saved settings are merged over the defaults, so a setting added in a
  // later version simply takes its default until the user changes it.
  useEffect(() => {
    let cancelled = false;
    repo
      .load()
      .then(async (saved) => {
        // Settings are only saved once one changes, so someone who has logged things but never
        // changed a setting has none saved either. If that can't be told, they aren't new.
        const inUse =
          saved !== null ||
          (await repo.hasLoggedAnything().catch((e) => {
            console.warn('Could not check for logged data', e);
            return true;
          }));
        if (cancelled) return;
        // A switch counts only as a real true or false; anything else takes the default.
        const flag = (value: unknown, fallback: boolean) =>
          typeof value === 'boolean' ? value : fallback;
        const loaded = {
          ...defaults,
          ...saved,
          // Older saves stored reminder times as text; fall back per field.
          reminders: mergeReminders(saved?.reminders),
          weighInFrequency:
            saved?.weighInFrequency === Frequency.Daily
              ? Frequency.Daily
              : Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
          medications: mergeMedications(saved?.medications),
          trackWater: flag(saved?.trackWater, defaults.trackWater),
          trackMood: flag(saved?.trackMood, defaults.trackMood),
          checkInAfterMeals: flag(
            saved?.checkInAfterMeals,
            defaults.checkInAfterMeals,
          ),
          trackMovement: flag(saved?.trackMovement, defaults.trackMovement),
          movementGoalMinutes:
            typeof saved?.movementGoalMinutes === 'number' &&
            Number.isFinite(saved.movementGoalMinutes)
              ? clampMovementGoal(saved.movementGoalMinutes)
              : defaults.movementGoalMinutes,
          adaptTarget: flag(saved?.adaptTarget, defaults.adaptTarget),
          aim: Object.values(Aim).includes(saved?.aim as Aim)
            ? (saved!.aim as Aim)
            : Aim.Maintain,
          journeyView: Object.values(JourneyView).includes(
            saved?.journeyView as JourneyView,
          )
            ? (saved!.journeyView as JourneyView)
            : defaults.journeyView,
          lastSuggestionWeek:
            typeof saved?.lastSuggestionWeek === 'string'
              ? saved.lastSuggestionWeek
              : null,
          // A setting added later inside health data takes its default.
          healthData: { ...defaults.healthData, ...saved?.healthData },
          // Decided here, before anything saves: nothing saved and nothing logged is a new install.
          onboarding: loadOnboarding(saved?.onboarding, inUse),
          trackWeight: flag(saved?.trackWeight, defaults.trackWeight),
          trackFood: flag(saved?.trackFood, defaults.trackFood),
          trackCalories: flag(saved?.trackCalories, defaults.trackCalories),
          showIntakeBars: flag(saved?.showIntakeBars, defaults.showIntakeBars),
          // Before macros had their own switch, "Track calories & macros" covered both.
          trackMacros: flag(
            saved?.trackMacros,
            typeof saved?.trackCalories === 'boolean'
              ? saved.trackCalories
              : defaults.trackMacros,
          ),
          proteinAsMinimum: flag(
            saved?.proteinAsMinimum,
            defaults.proteinAsMinimum,
          ),
          calorieZone: sanitizeCalorieZone(saved?.calorieZone),
          celebratedMilestone:
            typeof saved?.celebratedMilestone === 'number' &&
            Number.isFinite(saved.celebratedMilestone)
              ? saved.celebratedMilestone
              : null,
          weightGoalLb:
            typeof saved?.weightGoalLb === 'number' &&
            Number.isFinite(saved.weightGoalLb)
              ? saved.weightGoalLb
              : null,
          waterGoalOz:
            typeof saved?.waterGoalOz === 'number' &&
            Number.isFinite(saved.waterGoalOz)
              ? clampWaterGoal(saved.waterGoalOz)
              : WaterGoal.DEFAULT_OZ,
        };
        const name = signedUpNameRef.current?.trim();
        // Only when never set — clearing the name in Settings must stick.
        if (saved?.firstName === undefined && name) {
          loaded.firstName = name;
          repo
            .save(loaded)
            .catch((e) => console.warn('Could not save settings', e));
        }
        setSettings(loaded);
      })
      .catch((e) => {
        console.warn('Could not load settings', e);
        // Not knowing is no reason to start setup, whose answers would save over the real ones.
        if (!cancelled)
          setSettings((s) => ({ ...s, onboarding: Onboarding.DONE }));
      })
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [repo, defaults]);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const prev = latest.current;
      // A patch that changes nothing costs nothing: no save, no re-render.
      if (!changesAnything(prev, patch)) return;
      const next = { ...prev, ...patch };
      if (patch.stepGoal !== undefined && patch.stepGoal !== prev.stepGoal) {
        next.stepGoalHistory = recordGoalChange(
          prev.stepGoalHistory,
          prev.stepGoal,
          patch.stepGoal,
          dayKey(),
        );
      }
      latest.current = next;
      setSettings(next);
      repo.save(next).catch((e) => {
        console.warn('Could not save settings', e);
        toast.show("Couldn't save your settings — they may not stick.");
      });
    },
    [repo, toast],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, ready, updateSettings }),
    [settings, ready, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
