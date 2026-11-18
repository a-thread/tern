import { StepsStatus } from '@/domain/activity/models/stepsStatus';

export type NoStepsLine = {
  text: string;
  /** Tapping it opens Settings › Health data, where it can be fixed. */
  opensHealthData: boolean;
};

/** Today only (a past day can't be fixed here); a link only when Health data can help. */
export function noStepsLine({
  status,
  readSteps,
  isToday,
  movementGoal,
}: {
  status: StepsStatus;
  readSteps: boolean;
  isToday: boolean;
  /** Minutes of movement that make a goal day; 0 while movement isn't tracked. */
  movementGoal: number;
}): NoStepsLine | null {
  if (!isToday) return null;
  const orMovement =
    movementGoal > 0 ? `, or move ${movementGoal} min for a goal day` : '';
  switch (status) {
    case StepsStatus.Connected:
      return readSteps
        ? null
        : {
            text: `Reading steps is off${orMovement} ›`,
            opensHealthData: true,
          };
    case StepsStatus.NeedsPermission:
      return movementGoal > 0
        ? { text: `Connect steps${orMovement} ›`, opensHealthData: true }
        : { text: 'Connect steps to start a streak ›', opensHealthData: true };
    default:
      return movementGoal > 0
        ? {
            text: `${movementGoal} min of movement makes a goal day`,
            opensHealthData: false,
          }
        : { text: "Steps can't be read on this phone", opensHealthData: false };
  }
}
