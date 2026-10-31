import type { Units } from '@shared/utils/units';
import { type GoalChange } from './stepGoalHistory';
import { type Medication } from './medication';
import { WaterGoal } from './waterGoal';
import { MovementGoal } from './movementGoal';
import { Aim } from './aim';
import { JourneyView } from './journeyView';
import { settingsSeed } from '../settings.mock';
import { Frequency } from '@shared/models/frequency';
import { type ReminderConfig, Reminders } from './reminderPlan';
import { Onboarding, type OnboardingState } from './onboarding';

export type ReminderSettings = ReminderConfig;

export type HealthDataSettings = {
  readSteps: boolean;
  /** Read workouts (exercise sessions) as movement. */
  readWorkouts: boolean;
};

export type AppSettings = {
  firstName: string;
  stepGoal: number;
  /** Past step-goal changes, so a new goal only applies from the day it was set. */
  stepGoalHistory: GoalChange[];
  suggestStepAdjustments: boolean;
  calorieTarget: number;
  macroTargets: { protein: number; carbs: number; fat: number };
  /**
   * Logging food at all. Off, the Food tab and everything about meals (the meal row on Today,
   * meal reminders, meal waypoints and check-ins) go away; past logs are kept.
   */
  trackFood: boolean;
  /** Calorie targets and calorie numbers. Independent of macros: either can be tracked alone. */
  trackCalories: boolean;
  /** Protein, carb and fat targets and amounts. Independent of calories. */
  trackMacros: boolean;
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
  /** Optional check-in after each meal (fullness and how you feel); off by default. */
  checkInAfterMeals: boolean;
  /** Optional movement logging; off by default so it stays out of the way. */
  trackMovement: boolean;
  /** Minutes of movement in a day that make it a goal day, like reaching the step goal. */
  movementGoalMinutes: number;
  /** Suggest a calorie target from logged intake and the weight trend. Off by default. */
  adaptTarget: boolean;
  /** Which way the adaptive target aims. */
  aim: Aim;
  /** The week (its Monday) a target suggestion was last offered, so it's offered at most weekly. */
  lastSuggestionWeek: string | null;
  /**
   * The waypoint total of the last milestone that was celebrated, so each one
   * is marked once. Null until the first time Tern looks, when it's set to
   * whatever has already been passed — an existing journey isn't re-celebrated.
   */
  celebratedMilestone: number | null;
  /** Whether Journey draws the migration on a flat map or a globe. */
  journeyView: JourneyView;
  healthData: HealthDataSettings;
  /** The setup wizard, tips and getting-started card; see `loadOnboarding`. */
  onboarding: OnboardingState;
};

export const initialSettings: AppSettings = {
  firstName: '',
  stepGoal: settingsSeed.stepGoal,
  stepGoalHistory: [],
  suggestStepAdjustments: true,
  calorieTarget: settingsSeed.calorieTarget,
  macroTargets: { ...settingsSeed.macroTargets },
  trackFood: true,
  trackCalories: true,
  trackMacros: true,
  showIntakeBars: true,
  calorieZone: null,
  proteinAsMinimum: true,
  units: settingsSeed.units,
  weightGoalLb: null,
  trackWeight: true,
  showTiers: settingsSeed.showTiers,
  showTierNumber: true,
  showCalories: settingsSeed.showCalories,
  restDaysPerWeek: 2,
  autoDetectRestDays: true,
  reminders: Reminders.DEFAULTS,
  weighInFrequency: Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
  medications: [],
  trackWater: false,
  waterGoalOz: WaterGoal.DEFAULT_OZ,
  trackMood: false,
  checkInAfterMeals: false,
  trackMovement: false,
  movementGoalMinutes: MovementGoal.DEFAULT,
  adaptTarget: false,
  aim: Aim.Maintain,
  lastSuggestionWeek: null,
  celebratedMilestone: null,
  journeyView: JourneyView.Map,
  healthData: {
    readSteps: true,
    readWorkouts: true,
  },
  onboarding: Onboarding.NEW,
};

/**
 * The defaults for someone using Tern on the phone with no account: movement in place of
 * weight and calories, with water and mood on. Defaults only: anything they change is kept.
 */
export const phoneSettings: AppSettings = {
  ...initialSettings,
  trackMovement: true,
  movementGoalMinutes: 60,
  trackCalories: false,
  trackMacros: true,
  trackWeight: false,
  trackWater: true,
  trackMood: true,
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
