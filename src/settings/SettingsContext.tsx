import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBackend } from '@shared/state/BackendContext';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useAuth } from '@shared/auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { recordGoalChange } from '@today/models/stepGoal';
import { mergeMedications } from '@medication/models/medication';
import { clampWaterGoal, WaterLimits } from '@water/models/waterEntry';
import { mergeReminders, Reminders } from '@settings/models/reminderPlan';
import { initialSettings, changesAnything } from '@settings/models/appSettings';
import type { AppSettings } from '@settings/models/appSettings';

type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const [SettingsContext, useSettings] = createRequiredContext<SettingsContextValue>(
  'useSettings',
  'SettingsProvider',
);
export { useSettings };

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings: repo } = useBackend();
  const toast = useToast();
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
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
      .then((saved) => {
        if (cancelled) return;
        const loaded = {
          ...initialSettings,
          ...saved,
          // Older saves stored reminder times as text; fall back per field.
          reminders: mergeReminders(saved?.reminders),
          weighInFrequency:
            saved?.weighInFrequency === 'daily'
              ? 'daily'
              : Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
          medications: mergeMedications(saved?.medications),
          trackWater: saved?.trackWater === true,
          trackMood: saved?.trackMood === true,
          trackWeight: saved?.trackWeight !== false,
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
              : WaterLimits.DEFAULT_GOAL_OZ,
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
      .catch((e) => console.warn('Could not load settings', e))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [repo]);

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