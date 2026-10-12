import React, { useState } from 'react';
import { Text } from 'react-native';

import { space, typography } from '@/shared/theme';
import { TrendCard, TrendFigure } from '@/trends/components/TrendCard/TrendCard';
import { StepBars } from '@/trends/components/StepBars/StepBars';
import { useDayKey } from '@/shared/hooks/useDayKey';
import { useFocusLoad } from '@/trends/hooks/useFocusLoad';
import { addDays } from '@/shared/utils/date';
import { TrendRanges, TrendRange } from '@/trends/models/trendRange';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { useMovement } from '@/domain/movement/MovementContext';
import {
  ACTIVITY_LABEL,
  activityShare,
  formatDistance,
  goalMinutesByDay,
  minutesByDay,
  type MovementEntry,
} from '@/domain/movement/models/movementEntry';
import { averageMinutes, bucketMinutes } from '@/trends/components/MovementTrendCard/models/movementBars';

/** Active minutes over the Trends range: the daily average, a bar per day (or week), and what kinds. */
export function MovementTrendCard({
  range,
  refreshKey = 0,
}: {
  range: TrendRange;
  /** Bump to read the history again (pull to refresh). */
  refreshKey?: number;
}) {
  const { settings } = useSettings();
  const { units } = useUnits();
  const { todayMinutes, loadRange } = useMovement(); // todayMinutes is a trigger: reload after logging
  const today = useDayKey();
  const [entries, setEntries] = useState<MovementEntry[]>([]);

  useFocusLoad(
    () => loadRange(addDays(today, -(TrendRanges.DAYS[range] - 1)), today),
    setEntries,
    [loadRange, today, range, todayMinutes, refreshKey],
    'Could not load movement history',
  );

  const byDay = minutesByDay(entries);
  const average = averageMinutes(byDay, today, TrendRanges.DAYS[range]);
  const bars = bucketMinutes(byDay, settings.movementGoalMinutes, range, today, goalMinutesByDay(entries));
  const share = activityShare(entries)
    .slice(0, 3)
    .map((a) => `${ACTIVITY_LABEL[a.activity]} ${Math.round(a.share * 100)}%`)
    .join(' · ');
  const distanceM = entries.reduce((s, e) => s + (e.distanceM ?? 0), 0);
  const extras = [share, distanceM > 0 ? `${formatDistance(distanceM, units)} in all` : null].filter(Boolean).join(' · ');

  return (
    <TrendCard title='Active minutes'>
      <TrendFigure
        value={average === null ? '—' : `${average} min`}
        sub={
          average === null
            ? 'no movement logged yet'
            : `a day on average ${TrendRanges.LABEL[range]} · goal day at ${settings.movementGoalMinutes} min`
        }
      />
      <StepBars
        days={bars}
        goal={range === TrendRange.Week || range === TrendRange.Month ? settings.movementGoalMinutes : settings.movementGoalMinutes * 7}
        showLegend={false}
        showLabels={range !== TrendRange.Month}
      />
      {extras ? <Text style={{ ...typography.small, marginTop: space.sm }}>{extras}</Text> : null}
    </TrendCard>
  );
}

