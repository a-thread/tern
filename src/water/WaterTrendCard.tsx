import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { colors, font, space } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { StepBars } from '@shared/components/charts';
import { useBackend } from '@shared/state/BackendContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/useUnits';
import { averageDaily, bucketWater, totalsByDay, type WaterRange } from './models';
import { useWater } from './WaterContext';

const RANGE_DAYS = { Week: 7, Month: 30, '6 months': 180 } as const;
const RANGE_LABEL = { Week: 'this week', Month: 'this month', '6 months': 'over 6 months' } as const;

/** Average water per day, and a bar per day (or week), for the Trends range. */
export default function WaterTrendCard({ range }: { range: WaterRange }) {
  const { water } = useBackend();
  const { settings } = useSettings();
  const { formatVolume } = useUnits();
  const { totalOz } = useWater(); // a trigger: reload after logging a drink
  const today = useDayKey();
  const [byDay, setByDay] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      water
        .load(addDays(today, -(RANGE_DAYS[range] - 1)), today)
        .then((entries) => !cancelled && setByDay(totalsByDay(entries)))
        .catch((e) => console.warn('Could not load water history', e));
      return () => {
        cancelled = true;
      };
      // totalOz is a trigger, not an input.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [water, today, range, totalOz]),
  );

  const average = averageDaily(byDay, today, RANGE_DAYS[range]);
  const bars = bucketWater(byDay, settings.waterGoalOz, range, today);

  return (
    <Card style={{ marginBottom: space.md }}>
      <Text style={s.name}>Water</Text>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.value}>{average === null ? '—' : formatVolume(average)}</Text>
        <Text style={s.sub}>
          {average === null
            ? 'no water logged yet'
            : `daily average ${RANGE_LABEL[range]} · goal ${formatVolume(settings.waterGoalOz)}`}
        </Text>
      </View>
      <StepBars
        days={bars}
        goal={settings.waterGoalOz}
        showLegend={false}
        showLabels={range !== 'Month'}
      />
    </Card>
  );
}

const s = StyleSheet.create({
  name: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  value: { fontFamily: font.displayMedium, fontSize: 24, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
});
