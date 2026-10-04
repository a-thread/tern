import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, space } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/charts/WeightTrend';
import type { RootStackParamList } from '@shared/navigation/types';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { TrendRanges, type TrendRange } from '@shared/models/trendRange';
import { average, entriesBetween, seriesOf } from '@mood/models/moodStats';
import { MoodMetric } from '@mood/models/moodEntry';
import { useMood } from '@mood/MoodContext';


const METRICS: { id: MoodMetric; label: string }[] = [
  { id: MoodMetric.Mood, label: 'Mood' },
  { id: MoodMetric.Stress, label: 'Stress' },
];

/** Average mood and stress for the Trends range, each with its line. Tapping opens today's check-in. */
export default function MoodTrendCard({ range }: { range: TrendRange }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { entries } = useMood();
  const today = useDayKey();
  const inRange = entriesBetween(entries, addDays(today, -(TrendRanges.DAYS[range] - 1)), today);

  return (
    <Pressable onPress={() => navigation.navigate('CheckIn')}>
      <Card style={{ marginBottom: space.md }}>
        <Text style={s.name}>Mood &amp; stress</Text>
        {inRange.length === 0 ? (
          <Text style={s.sub}>No check-ins in this range yet.</Text>
        ) : (
          METRICS.map((m, i) => {
            const avg = average(inRange, m.id);
            return (
              <View key={m.id} style={i > 0 ? s.block : undefined}>
                <Text style={s.value}>{avg === null ? '—' : `${m.label} ${avg.toFixed(1)}`}</Text>
                <Text style={s.sub}>{`average ${TrendRanges.LABEL[range]} · out of 10`}</Text>
                {inRange.length > 1 ? (
                  <WeightTrend trend={seriesOf(inRange, m.id)} spread={0.5} height={60} />
                ) : null}
              </View>
            );
          })
        )}
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  name: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  value: { fontFamily: font.displayMedium, fontSize: 24, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
  block: { marginTop: space.md },
});
