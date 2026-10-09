import type { Activity } from '@movement/models/movementEntry';

/** The movement logging flow, presented modally from the root stack. */
export type MovementStackParamList = {
  /** The exercise list. `day` is today unless logging for yesterday. */
  Exercises: { day?: string };
  ExerciseDetail: { activity: Activity; day: string };
};
