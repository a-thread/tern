import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FoodEntry } from '@food/models/foodEntry';

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

export type RestDayParams = {
  dayName: string;
  steps: number;
  waypoints: number;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  LogFood: { meal: FoodEntry['meal'] };
  LogWeight: undefined;
  CheckIn: undefined;
  /** The movement logging flow; `day` is today unless logging for yesterday. */
  LogMovement: { day?: string } | undefined;
  EditFood: { entryId: string };
  SaveMeal: { meal: FoodEntry['meal'] };
  Settings: NavigatorScreenParams<SettingsStackParamList> | undefined;
  /** The waypoints card, from the chip on Today. */
  Waypoints: { streak: number };
  /** Passing a stop: `waypoints` is the stop's running total. */
  Milestone: { waypoints: number };
  RestDay: RestDayParams;
};

export type TabParamList = {
  Today: undefined;
  Food: undefined;
  Trends: undefined;
  Journey: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
