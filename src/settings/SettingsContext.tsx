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
import { settingsSeed } from './mock';

export type ReminderSettings = {
  mealLog: { on: boolean; time: string };
  weeklyWeighIn: { on: boolean; time: string };
  stepGoalNudge: { on: boolean };
};

export type HealthDataSettings = {
  connected: boolean;
  lastSynced: string;
  readSteps: boolean;
  readDistance: boolean;
  readWeight: boolean;
  writeWeight: boolean;
  writeNutrition: boolean;
};

export type AppSettings = {
  stepGoal: number;
  suggestStepAdjustments: boolean;
  calorieTarget: number;
  macroTargets: { protein: number; carbs: number; fat: number };
  trackCalories: boolean;
  weightGoalKg: number;
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
  stepGoal: settingsSeed.stepGoal,
  suggestStepAdjustments: true,
  calorieTarget: settingsSeed.calorieTarget,
  macroTargets: { ...settingsSeed.macroTargets },
  trackCalories: true,
  weightGoalKg: settingsSeed.weightGoalKg,
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
    connected: true,
    lastSynced: '4 minutes ago',
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
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [ready, setReady] = useState(false);
  const latest = useRef(settings);
  latest.current = settings;

  // Saved settings are merged over the defaults, so a setting added in a
  // later version simply takes its default until the user changes it.
  useEffect(() => {
    let cancelled = false;
    repo
      .load()
      .then((saved) => {
        if (!cancelled && saved) setSettings({ ...initialSettings, ...saved });
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
      repo.save(next).catch((e) => console.warn('Could not save settings', e));
    },
    [repo],
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
