import type { Units } from '@shared/utils/units';
import type { GoalChange } from '@today/models/stepGoal';
import type { Medication } from '@medication/models/medication';
import { WaterLimits } from '@water/models/waterEntry';
import { settingsSeed } from '@settings/data/settings.mock';
import { Frequency } from '@shared/models/frequency';
import { type ReminderConfig, Reminders } from './reminderPlan';

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
  /** Optional intake bars on the Food page; off by default so it stays out of the way. */
  showIntakeBars: boolean;
  /** Calorie "target zone" for the intake bar; null derives one from calorieTarget. */
  calorieZone: { min: number; max: number } | null;
  /** Show protein as a minimum to reach rather than a limit to fill toward. */
  proteinAsMinimum: boolean;
  /** Display only; weight is stored in pounds either way. */
  units: Units;
  /** Optional; null (the default) means no goal weight, and no goal line anywhere. */
  weightGoalLb: number | null;
  /** Weight is optional too: off, Today never asks for a weigh-in and there's no weigh-in reminder. */
  trackWeight: boolean;
  showTiers: boolean;
  showTierNumber: boolean;
  showCalories: boolean;
  showRemainingVsTarget: boolean;
  restDaysPerWeek: number;
  autoDetectRestDays: boolean;
  reminders: ReminderSettings;
  /** How often to weigh in: sets the reminder, and how often Today asks. */
  weighInFrequency: Frequency;
  /** Medications the person tracks. Empty = the feature stays out of the way. */
  medications: Medication[];
  /** Optional water tracking; off by default so it stays out of the way. */
  trackWater: boolean;
  /** Daily water goal, in ounces (ounces are a display choice). */
  waterGoalOz: number;
  /** Optional daily mood and stress check-in; off by default so it stays out of the way. */
  trackMood: boolean;
  /**
   * The waypoint total of the last milestone that was celebrated, so each one
   * is marked once. Null until the first time Tern looks, when it's set to
   * whatever has already been passed — an existing journey isn't re-celebrated.
   */
  celebratedMilestone: number | null;
  healthData: HealthDataSettings;
};

export const initialSettings: AppSettings = {
  firstName: '',
  stepGoal: settingsSeed.stepGoal,
  stepGoalHistory: [],
  suggestStepAdjustments: true,
  calorieTarget: settingsSeed.calorieTarget,
  macroTargets: { ...settingsSeed.macroTargets },
  trackCalories: true,
  showIntakeBars: false,
  calorieZone: null,
  proteinAsMinimum: true,
  units: settingsSeed.units,
  weightGoalLb: null,
  trackWeight: true,
  showTiers: settingsSeed.showTiers,
  showTierNumber: true,
  showCalories: settingsSeed.showCalories,
  showRemainingVsTarget: false,
  restDaysPerWeek: 2,
  autoDetectRestDays: true,
  reminders: Reminders.DEFAULTS,
  weighInFrequency: Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
  medications: [],
  trackWater: false,
  waterGoalOz: WaterLimits.DEFAULT_GOAL_OZ,
  trackMood: false,
  celebratedMilestone: null,
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