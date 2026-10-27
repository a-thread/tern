import { StepsStatus } from '../../domain/activity/models/stepsStatus';

/**
 * Why a steps chart is empty, in place of the chart while steps can't be read: switched off,
 * not allowed yet, or not possible on this phone (where pointing at Settings would lead nowhere).
 */
export function noStepsNote(status: StepsStatus, readSteps: boolean): string {
  switch (status) {
    case StepsStatus.Connected:
      return readSteps
        ? ''
        : 'Reading steps is off. Turn it on in Settings → Health data to see this.';
    case StepsStatus.NeedsPermission:
      return 'Connect step data in Settings → Health data to see this.';
    default:
      return "Steps can't be read on this phone.";
  }
}
