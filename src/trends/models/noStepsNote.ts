import { StepsStatus } from '../../domain/activity/models/stepsStatus';

/** No Settings link where the phone can't read steps at all. */
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
