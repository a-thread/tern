import { colors } from '@shared/theme';
import { DayState } from '@shared/models/dayState';

export type DayStateStyle = {
  backgroundColor: string;
  borderWidth?: number;
  borderColor?: string;
};

/**
 * How each kind of day is drawn in Trends: a step bar, a square in the consistency grid and the
 * legend's swatch all use this, so one key reads the same everywhere. Partial is an outline,
 * never the pale fill, which is a frozen day's.
 */
export const DAY_STATE_STYLE: Readonly<Record<DayState, DayStateStyle>> = {
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
export const DAY_STATE_LABEL: Readonly<Record<DayState, string>> = {
  [DayState.Goal]: 'goal met',
  [DayState.Partial]: 'partial',
  [DayState.Rest]: 'rest',
  [DayState.Frozen]: 'freeze',
  [DayState.None]: 'no steps',
};
