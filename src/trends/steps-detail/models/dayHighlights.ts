import { DayState } from '@shared/models/dayState';
import type { DayRecord } from '@/domain/activity/models/dayRecord';

type Day = Pick<DayRecord, 'day' | 'steps' | 'state'>;

export type DayHighlights<T extends Day> = {
  /** The day with the most steps; null when none has any. */
  strongest: T | null;
  /** The day with the fewest steps, other than the strongest; null when there's no such day. */
  quietest: T | null;
};

/**
 * The strongest and quietest of `days`, among those with steps. A rest day is a day off, not a
 * quiet one, so it is never picked as the quietest (it can still be the strongest).
 */
export function dayHighlights<T extends Day>(
  days: readonly T[],
): DayHighlights<T> {
  const withSteps = days.filter((d) => d.steps > 0);
  const strongest = withSteps.reduce<T | null>(
    (a, d) => (!a || d.steps > a.steps ? d : a),
    null,
  );
  const quietest = withSteps
    .filter((d) => d.state !== DayState.Rest && d !== strongest)
    .reduce<T | null>((a, d) => (!a || d.steps < a.steps ? d : a), null);
  return { strongest, quietest };
}
