import type { FoodEntry } from '@food/models';

export type RewardParams = {
  kind: 'goal' | 'milestone' | 'loafing';
  title: string;
  subtitle: string;
  /** Omit for a plain status view (e.g. "waypoints so far") with no specific event just earned. */
  points?: number;
  footer?: string;
};

export type RestDayParams = {
  dayName: string;
  steps: number;
  waypoints: number;
};

export type RootStackParamList = {
  Tabs: undefined;
  LogFood: { meal: FoodEntry['meal'] };
  LogWeight: undefined;
  EditFood: { entryId: string };
  SaveMeal: { meal: FoodEntry['meal'] };
  Settings: undefined;
  Reward: RewardParams;
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
