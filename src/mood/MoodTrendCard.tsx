import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, space } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/charts';
import type { RootStackParamList } from '@shared/navigation/types';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { average, entriesBetween, seriesOf, type MoodMetric } from './models';
import { useMood } from './MoodContext';

type Range = 'Week' | 'Month' | '6 months';
const RANGE_DAYS = { Week: 7, Month: 30, '6 months': 180 } as const;
const RANGE_LABEL = { Week: 'this week', Month: 'this month', '6 months': 'over 6 months' } as const;

const METRICS: { id: MoodMetric; label: string }[] = [
  { id: 'mood', label: 'Mood' },
  { id: 'stress', label: 'Stress' },
];

/** Average mood and stress for the Trends range, each with its line. Tapping opens today's check-in. */
export default function MoodTrendCard({ range }: { range: Range }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { entries } = useMood();
  const today = useDayKey();
  const inRange = entriesBetween(entries, addDays(today, -(RANGE_DAYS[range] - 1)), today);

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
                <Text style={s.sub}>{`average ${RANGE_LABEL[range]} · out of 10`}</Text>
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
