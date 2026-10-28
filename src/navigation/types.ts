import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FoodEntry } from '../domain/food/models/foodEntry';
import { TabParamList } from './tabs/types';

export type SettingsStackParamList = {
  SettingsRoot: undefined;
  /** Section pages, one per row of the Settings index. */
  ActivitySettings: undefined;
  FoodSettings: undefined;
  WeightSettings: undefined;
  WaterSettings: undefined;
  MoodSettings: undefined;
  RemindersSettings: undefined;
  DataSettings: undefined;
  StepGoal: undefined;
  FoodDisplay: undefined;
  HealthData: undefined;
  Targets: undefined;
  RestDays: undefined;
  Medication: undefined;
};

/** The setup wizard's screens; the names match `WizardStep`. */
export type WelcomeStackParamList = {
  Intro: undefined;
  Track: undefined;
  Steps: undefined;
  FoodStyle: undefined;
  CalorieTarget: undefined;
  TargetZone: undefined;
  MacroTargets: undefined;
  Account: undefined;
  Reminders: undefined;
};

export type RestDayParams = {
  dayName: string;
  steps: number;
  waypoints: number;
};

export type RootStackParamList = {
  /** The setup wizard, only while a new install hasn't finished or skipped it. */
  Welcome: NavigatorScreenParams<WelcomeStackParamList> | undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  LogFood: { meal: FoodEntry['meal'] };
  LogWeight: undefined;
  CheckIn: undefined;
  /** How a meal sat, on the viewed day. */
  MealCheckIn: { meal: FoodEntry['meal'] };
  /** The movement logging flow; `day` is today unless logging for yesterday. */
  LogMovement: { day?: string } | undefined;
  EditFood: { entryId: string };
  SaveMeal: { meal: FoodEntry['meal'] };
  Settings: NavigatorScreenParams<SettingsStackParamList> | undefined;
  /** The waypoints card, from the chip on Today. */
  Waypoints: { streak: number };
  /** Passing a stop: `waypoints` is the stop's running total. */
  Milestone: { waypoints: number };
  /** A stop already passed, from its row on Journey: `waypoints` is the stop's running total. */
  Destination: { waypoints: number };
  /** What the streak and freeze chips on Today mean. */
  Streak: undefined;
  RestDay: RestDayParams;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
