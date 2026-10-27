import {
  listedRules,
  WaypointSource,
} from '../../domain/waypoints/models/waypoint';

/** What can earn waypoints right now, from what's tracked and set up. */
export type Earnable = {
  food: boolean;
  mood: boolean;
  water: boolean;
  movement: boolean;
  weight: boolean;
  medication: boolean;
  /** A goal day can be reached: steps are read, or movement is tracked. */
  goal: boolean;
  /** The week allows rest days. */
  rest: boolean;
};

const NEEDS: Partial<Record<WaypointSource, keyof Earnable>> = {
  [WaypointSource.Steps]: 'goal',
  [WaypointSource.Streak]: 'goal',
  [WaypointSource.Meals]: 'food',
  [WaypointSource.Breakfast]: 'food',
  [WaypointSource.Water]: 'water',
  [WaypointSource.Mood]: 'mood',
  [WaypointSource.Movement]: 'movement',
  [WaypointSource.Weight]: 'weight',
  [WaypointSource.Medication]: 'medication',
  [WaypointSource.Rest]: 'rest',
};

/** "How waypoints are earned": only the rules that can pay out, so none is a dead end. */
export function earnableRules(on: Earnable) {
  return listedRules().filter((rule) => {
    const need = NEEDS[rule.id];
    return need === undefined || on[need];
  });
}
