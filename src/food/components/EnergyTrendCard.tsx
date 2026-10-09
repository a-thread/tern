import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { colors, font, space } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { AdaptiveTarget, weeklyEnergy, type EnergyWeek } from '@food/models/energyBalance';

const WEEKS = 8;
const W = 300;
const H = 90;

/**
 * Estimated burn against logged intake, week by week, for the last eight
 * weeks: why the adaptive target moves. Shown in Trends while it's on.
 */
export function EnergyTrendCard() {
  const { loadHistory, loadSkippedHistory, foodLog } = useFood();
  const { weightEntries } = useWeight();
  const today = useDayKey();
  const [weeks, setWeeks] = useState<EnergyWeek[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const from = addDays(today, -(WEEKS * 7 + AdaptiveTarget.WINDOW_DAYS + 1));
      const to = addDays(today, -1);
      Promise.all([loadHistory(from, to), loadSkippedHistory(from, to)])
        .then(([foodByDay, skippedByDay]) => {
          if (!cancelled) setWeeks(weeklyEnergy({ foodByDay, skippedByDay, weighs: weightEntries, today, weeks: WEEKS }));
        })
        .catch((e) => console.warn('Could not load intake and burn', e));
      return () => {
        cancelled = true;
      };
      // foodLog is a trigger, not an input.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadHistory, loadSkippedHistory, weightEntries, today, foodLog.length]),
  );

  const values = weeks.flatMap((w) => [w.burn, w.intake]).filter((v): v is number => v !== null);
  const latest = [...weeks].reverse().find((w) => w.burn !== null);
  const lo = values.length ? Math.min(...values) - 100 : 0;
  const hi = values.length ? Math.max(...values) + 100 : 1;
  const x = (i: number) => (i / Math.max(weeks.length - 1, 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const line = (key: 'burn' | 'intake') =>
    weeks
      .map((w, i) => (w[key] === null ? null : `${x(i).toFixed(1)},${y(w[key] as number).toFixed(1)}`))
      .filter(Boolean)
      .join(' ');

  return (
    <Card style={{ marginBottom: space.md }}>
      <Text style={s.name}>Intake and burn</Text>
      <Text style={s.value}>{latest?.burn ? `${latest.burn.toLocaleString()} a day` : '—'}</Text>
      <Text style={s.sub}>
        {latest?.burn ? `estimated burn · last ${WEEKS} weeks` : 'still learning your burn'}
      </Text>
      {values.length ? (
        <View style={{ marginTop: space.sm }}>
          <Svg viewBox={`0 0 ${W} ${H}`} width='100%' height={H} accessibilityLabel='Estimated burn and logged intake by week'>
            {[0.25, 0.5, 0.75].map((f) => (
              <Line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke={colors.border} strokeWidth={1} />
            ))}
            <Polyline points={line('burn')} fill='none' stroke={colors.aurora} strokeWidth={2.5} />
            <Polyline points={line('intake')} fill='none' stroke={colors.sunDeep} strokeWidth={2} strokeDasharray='5 4' />
          </Svg>
          <Text style={s.legend}>
            <Text style={{ color: colors.aurora }}>━ </Text>estimated burn{'   '}
            <Text style={{ color: colors.sunDeep }}>┅ </Text>logged intake
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  name: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  value: { fontFamily: font.displayMedium, fontSize: 24, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
  legend: { fontFamily: font.body, fontSize: 11, color: colors.ink2, marginTop: 6 },
});
