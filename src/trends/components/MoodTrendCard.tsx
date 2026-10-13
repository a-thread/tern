import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { space, typography } from '@shared/theme';
import { WeightTrend } from '@shared/components/WeightTrend';
import { TrendCard, TrendFigure } from './TrendCard';
import { useRootNavigation } from '../../navigation/useAppNavigation';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { TrendRanges, type TrendRange } from '../models/trendRange';
import {
  average,
  entriesBetween,
  seriesOf,
} from '../../domain/mood/models/moodStats';
import { MoodMetric } from '../../domain/mood/models/moodEntry';
import { useMood } from '../../domain/mood/MoodContext';

const METRICS: { id: MoodMetric; label: string }[] = [
  { id: MoodMetric.Mood, label: 'Mood' },
  { id: MoodMetric.Stress, label: 'Stress' },
];

/** Average mood and stress for the Trends range, each with its line. Tapping opens today's check-in. */
export default function MoodTrendCard({ range }: { range: TrendRange }) {
  const navigation = useRootNavigation();
  const { entries } = useMood();
  const today = useDayKey();
  const inRange = entriesBetween(
    entries,
    addDays(today, -(TrendRanges.DAYS[range] - 1)),
    today,
  );

  return (
    <TrendCard
      title='Mood & stress'
      onPress={() => navigation.navigate('CheckIn')}
    >
      {inRange.length === 0 ? (
        <Text style={s.sub}>No check-ins in this range yet.</Text>
      ) : (
        METRICS.map((m, i) => {
          const avg = average(inRange, m.id);
          return (
            <View key={m.id} style={i > 0 ? s.block : undefined}>
              <TrendFigure
                value={avg === null ? '—' : `${m.label} ${avg.toFixed(1)}`}
                sub={`average ${TrendRanges.LABEL[range]} · out of 10`}
              />
              {inRange.length > 1 ? (
                <WeightTrend
                  trend={seriesOf(inRange, m.id)}
                  spread={0.5}
                  height={60}
                />
              ) : null}
            </View>
          );
        })
      )}
    </TrendCard>
  );
}

const s = StyleSheet.create({
  sub: typography.small,
  block: { marginTop: space.md },
});
