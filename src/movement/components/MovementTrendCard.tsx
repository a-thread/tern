import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { colors, font, space } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { StepBars } from '@shared/components/charts/StepBars';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { TrendRanges, TrendRange } from '@shared/models/trendRange';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/hooks/useUnits';
import { useMovement } from '@movement/MovementContext';
import {
  ACTIVITY_LABEL,
  activityShare,
  formatDistance,
  goalMinutesByDay,
  minutesByDay,
  type MovementEntry,
} from '@movement/models/movementEntry';
import { averageMinutes, bucketMinutes } from '@movement/models/movementBars';

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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadRange(addDays(today, -(TrendRanges.DAYS[range] - 1)), today)
        .then((e) => !cancelled && setEntries(e))
        .catch((e) => console.warn('Could not load movement history', e));
      return () => {
        cancelled = true;
      };
      // todayMinutes and refreshKey are triggers, not inputs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadRange, today, range, todayMinutes, refreshKey]),
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
    <Card style={{ marginBottom: space.md }}>
      <Text style={s.name}>Active minutes</Text>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.value}>{average === null ? '—' : `${average} min`}</Text>
        <Text style={s.sub}>
          {average === null
            ? 'no movement logged yet'
            : `a day on average ${TrendRanges.LABEL[range]} · goal day at ${settings.movementGoalMinutes} min`}
        </Text>
      </View>
      <StepBars
        days={bars}
        goal={range === TrendRange.Week || range === TrendRange.Month ? settings.movementGoalMinutes : settings.movementGoalMinutes * 7}
        showLegend={false}
        showLabels={range !== TrendRange.Month}
      />
      {extras ? <Text style={[s.sub, { marginTop: space.sm }]}>{extras}</Text> : null}
    </Card>
  );
}

const s = StyleSheet.create({
  name: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  value: { fontFamily: font.displayMedium, fontSize: 24, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
});
