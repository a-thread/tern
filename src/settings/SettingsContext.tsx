import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBackend } from '@shared/state/BackendContext';
import { useAuth } from '@shared/auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';
import type { Units } from '@shared/utils/units';
import { dayKey } from '@shared/utils/date';
import { recordGoalChange, type GoalChange } from '@today/models';
import { mergeMedications, type Medication } from '@medication/medications';
import { settingsSeed } from './mock';
import {
  DEFAULT_REMINDERS,
  DEFAULT_WEIGH_IN_FREQUENCY,
  mergeReminders,
  type ReminderConfig,
  type WeighInFrequency,
} from './reminders.plan';

export type ReminderSettings = ReminderConfig;

export type HealthDataSettings = {
  readSteps: boolean;
};

export type AppSettings = {
  firstName: string;
  stepGoal: number;
  /** Past step-goal changes, so a new goal only applies from the day it was set. */
  stepGoalHistory: GoalChange[];
  suggestStepAdjustments: boolean;
  calorieTarget: number;
  macroTargets: { protein: number; carbs: number; fat: number };
  trackCalories: boolean;
  /** Display only; weight is stored in pounds either way. */
  units: Units;
  weightGoalLb: number;
  showTiers: boolean;
  showTierNumber: boolean;
  showCalories: boolean;
  showRemainingVsTarget: boolean;
  restDaysPerWeek: number;
  autoDetectRestDays: boolean;
  reminders: ReminderSettings;
  /** How often to weigh in: sets the reminder, and how often Today asks. */
  weighInFrequency: WeighInFrequency;
  /** Medications the person tracks. Empty = the feature stays out of the way. */
  medications: Medication[];
  healthData: HealthDataSettings;
};

const initialSettings: AppSettings = {
  firstName: '',
  stepGoal: settingsSeed.stepGoal,
  stepGoalHistory: [],
  suggestStepAdjustments: true,
  calorieTarget: settingsSeed.calorieTarget,
  macroTargets: { ...settingsSeed.macroTargets },
  trackCalories: true,
  units: settingsSeed.units,
  weightGoalLb: settingsSeed.weightGoalLb,
  showTiers: settingsSeed.showTiers,
  showTierNumber: true,
  showCalories: settingsSeed.showCalories,
  showRemainingVsTarget: false,
  restDaysPerWeek: 2,
  autoDetectRestDays: true,
  reminders: DEFAULT_REMINDERS,
  weighInFrequency: DEFAULT_WEIGH_IN_FREQUENCY,
  medications: [],
  healthData: {
    readSteps: true,
  },
};

export function changesAnything(
  current: AppSettings,
  patch: Partial<AppSettings>,
): boolean {
  return (Object.keys(patch) as (keyof AppSettings)[]).some(
    (k) =>
      current[k] !== patch[k] &&
      JSON.stringify(current[k]) !== JSON.stringify(patch[k]),
  );
}

type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

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
            saved?.weighInFrequency === 'daily' ? 'daily' : DEFAULT_WEIGH_IN_FREQUENCY,
          medications: mergeMedications(saved?.medications),
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

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
