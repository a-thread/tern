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
import { settingsSeed } from './mock';

export type ReminderSettings = {
  mealLog: { on: boolean; time: string };
  weeklyWeighIn: { on: boolean; time: string };
  stepGoalNudge: { on: boolean };
};

export type HealthDataSettings = {
  readSteps: boolean;
  readDistance: boolean;
  readWeight: boolean;
  writeWeight: boolean;
  writeNutrition: boolean;
};

export type AppSettings = {
  firstName: string;
  stepGoal: number;
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
  healthData: HealthDataSettings;
};

const initialSettings: AppSettings = {
  firstName: '',
  stepGoal: settingsSeed.stepGoal,
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
  reminders: {
    mealLog: { on: true, time: '12:30 pm, 7:00 pm' },
    weeklyWeighIn: { on: true, time: 'Sundays, 8:00 am' },
    stepGoalNudge: { on: false },
  },
  healthData: {
    readSteps: true,
    readDistance: true,
    readWeight: false,
    writeWeight: true,
    writeNutrition: false,
  },
};

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
        const loaded = { ...initialSettings, ...saved };
        const name = signedUpNameRef.current?.trim();
        // Only when never set — clearing the name in Settings must stick.
        if (saved?.firstName === undefined && name) {
          loaded.firstName = name;
          repo.save(loaded).catch((e) => console.warn('Could not save settings', e));
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
      const next = { ...latest.current, ...patch };
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
