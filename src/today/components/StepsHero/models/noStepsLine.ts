import { StepsStatus } from '@/domain/activity/models/stepsStatus';

export type NoStepsLine = {
  text: string;
  /** Tapping it opens Settings › Health data, where it can be fixed. */
  opensHealthData: boolean;
};

/**
 * What the sky card says under the count while steps can't be read, or null for nothing.
 * Only today gets a line: a past day can't be fixed from here. Only something that can be
 * done from Health data is a link (nothing can connect on a phone with no health app), and
 * while movement is tracked it's named as the other way to a goal day.
 */
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
