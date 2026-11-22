import { colors } from '@shared/theme';
import { DayState } from '@shared/models/dayState';

export type DayStateStyle = {
  backgroundColor: string;
  borderWidth?: number;
  borderColor?: string;
};

/** How each kind of day looks, and what it is called, in Trends. */
export class DayStateLook {
  /** Shared by bars, grid and legend. Partial is an outline; the pale fill is frozen's. */
  static readonly STYLE: Readonly<Record<DayState, DayStateStyle>> = {
    [DayState.Goal]: { backgroundColor: colors.glacier },
    [DayState.Partial]: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.glacier,
    },
    [DayState.Rest]: {
      backgroundColor: colors.driftwoodTint,
      borderWidth: 1,
      borderColor: colors.driftwood,
    },
    [DayState.Frozen]: {
      backgroundColor: colors.glacierTint,
      borderWidth: 1,
      borderColor: colors.glacierDeep,
    },
    [DayState.None]: { backgroundColor: colors.progressTrack },
  };

  /** What each kind of day is called in a legend. */
  static readonly LABEL: Readonly<Record<DayState, string>> = {
    [DayState.Goal]: 'goal met',
    [DayState.Partial]: 'partial',
    [DayState.Rest]: 'rest',
    [DayState.Frozen]: 'freeze',
    [DayState.None]: 'no steps',
  };
}
