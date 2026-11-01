import type { Activity } from '../domain/movement/models/movementEntry';

/** The movement logging flow, presented modally from the root stack. */
export type MovementStackParamList = {
  /** The exercise list. `day` is today unless logging for yesterday. */
  Exercises: { day?: string };
  /** One exercise to log, or with `entryId` a logged one to change. */
  ExerciseDetail: { activity: Activity; day: string; entryId?: string };
};
