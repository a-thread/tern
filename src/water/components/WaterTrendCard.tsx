import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { colors, font, space } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { StepBars } from '@shared/components/charts/StepBars';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/hooks/useUnits';
import { averageDaily, bucketWater } from '@water/models/waterBars';
import { totalsByDay } from '@water/models/waterEntry';
import { TrendRanges, TrendRange } from '@shared/models/trendRange';
import { useWater } from '@water/WaterContext';


/** Average water per day, and a bar per day (or week), for the Trends range. */
export default function WaterTrendCard({
  range,
  refreshKey = 0,
}: {
  range: TrendRange;
  /** Bump to read the history again (pull to refresh). */
  refreshKey?: number;
}) {
  const { settings } = useSettings();
  const { formatVolume } = useUnits();
  const { totalOz, loadRange } = useWater(); // totalOz is a trigger: reload after logging a drink
  const today = useDayKey();
  const [byDay, setByDay] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadRange(addDays(today, -(TrendRanges.DAYS[range] - 1)), today)
        .then((entries) => !cancelled && setByDay(totalsByDay(entries)))
        .catch((e) => console.warn('Could not load water history', e));
      return () => {
        cancelled = true;
      };
      // totalOz and refreshKey are triggers, not inputs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadRange, today, range, totalOz, refreshKey]),
  );

  const average = averageDaily(byDay, today, TrendRanges.DAYS[range]);
  const bars = bucketWater(byDay, settings.waterGoalOz, range, today);

  return (
    <Card style={{ marginBottom: space.md }}>
      <Text style={s.name}>Water</Text>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.value}>{average === null ? '—' : formatVolume(average)}</Text>
        <Text style={s.sub}>
          {average === null
            ? 'no water logged yet'
            : `daily average ${TrendRanges.LABEL[range]} · goal ${formatVolume(settings.waterGoalOz)}`}
        </Text>
      </View>
      <StepBars
        days={bars}
        goal={settings.waterGoalOz}
        showLegend={false}
        showLabels={range !== TrendRange.Month}
      />
    </Card>
  );
}

const s = StyleSheet.create({
  name: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  value: { fontFamily: font.displayMedium, fontSize: 24, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
});
