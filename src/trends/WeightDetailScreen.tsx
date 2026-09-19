import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, space } from '@shared/theme';
import {
  Card,
  GroupLabel,
  PushHeader,
  Row,
  Insight,
  FootNote,
} from '@shared/components/ui';
import { WeightTrend } from '@shared/components/charts';
import { useWeight } from '@weight/WeightContext';
import { useSettings } from '@settings/SettingsContext';
import { formatLoggedAt } from '@weight/models';
import type { TrendsStackParamList } from './types';

type Props = NativeStackScreenProps<TrendsStackParamList, 'WeightDetail'>;

const RANGES = ['Month', '6 months', 'All'] as const;
const MIN_TREND_ENTRIES = 7;

export default function WeightDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<(typeof RANGES)[number]>('6 months');
  const { weightEntries, weightTrend } = useWeight();
  const { settings } = useSettings();

  const latest = weightTrend[weightTrend.length - 1];
  const delta = latest - weightTrend[0];
  const spread = 0.6;
  const hasTrend = weightEntries.length >= MIN_TREND_ENTRIES;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Weight'
        backLabel='Trends'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.seg}>
          {RANGES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[s.segItem, range === r && s.segOn]}
            >
              <Text style={[s.segText, range === r && s.segTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Card style={{ marginBottom: space.md }}>
          {hasTrend ? (
            <>
              <View style={s.metricTop}>
                <View>
                  <Text style={s.metricValue}>{latest.toFixed(1)} kg</Text>
                  <Text style={s.metricSub}>
                    7-day average · goal {settings.weightGoalKg} kg
                  </Text>
                </View>
                <View style={s.delta}>
                  <Text style={s.deltaText}>
                    {delta > 0 ? '+' : '−'}
                    {Math.abs(delta).toFixed(1)} kg
                  </Text>
                </View>
              </View>
              <WeightTrend
                trend={weightTrend}
                spread={spread}
                height={110}
                goalKg={settings.weightGoalKg}
              />
              <View style={s.legend}>
                <LegendDot color={colors.water} label='trend' />
                <LegendDot color={colors.doveTint} label='daily range' />
                <LegendDot color={colors.kelp} label='goal' />
              </View>
            </>
          ) : (
            <View style={s.emptyWeight}>
              <Svg
                width={36}
                height={36}
                viewBox='0 0 24 24'
                fill='none'
                stroke={colors.dove}
                strokeWidth={1.5}
              >
                <Path d='M4 19V9m6 10V4m6 15v-6' />
              </Svg>
              <Text style={s.emptyTitle}>Weight trends need a week</Text>
              <Text style={s.emptyBody}>
                You've logged {weightEntries.length} time
                {weightEntries.length === 1 ? '' : 's'} so far. After about{' '}
                {MIN_TREND_ENTRIES} entries, Tern can show a trend line that
                filters out daily noise.
              </Text>
            </View>
          )}
        </Card>

        {hasTrend ? (
          <Insight
            icon={
              <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
                <Path
                  d='M3 17l6-6 4 4 8-8'
                  stroke={colors.water}
                  strokeWidth={2}
                  strokeLinecap='round'
                />
              </Svg>
            }
          >
            {`The shaded band is your day-to-day spread — usually about ${(spread * 2).toFixed(1)} kg wide. That's normal fluctuation, not change.`}
          </Insight>
        ) : null}

        <GroupLabel>Entries</GroupLabel>
        <Card style={{ padding: 0 }}>
          {weightEntries.length ? (
            weightEntries.map((entry) => (
              <Row
                key={entry.id}
                title={`${entry.kg} kg`}
                sub={formatLoggedAt(entry.loggedAt)}
              />
            ))
          ) : (
            <Row
              title='No entries yet'
              sub='Log your first weight from Today'
            />
          )}
        </Card>

        <FootNote>
          Weight moves for many reasons — sleep, salt, hydration, time of day.
          The trend line is the part worth watching.
        </FootNote>
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.sw, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    padding: 3,
    marginVertical: space.md,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  segOn: { backgroundColor: '#fff' },
  segText: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  segTextOn: { fontFamily: font.semibold, color: colors.ink },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricValue: {
    fontFamily: font.displayMedium,
    fontSize: 30,
    color: colors.ink,
  },
  metricSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
  },
  delta: {
    backgroundColor: colors.waterTint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deltaText: { fontFamily: font.semibold, fontSize: 11.5, color: colors.water },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: space.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 9, height: 9, borderRadius: 2 },
  legendText: { fontFamily: font.body, fontSize: 10, color: colors.ink2 },
  emptyWeight: { alignItems: 'center', paddingVertical: 10 },
  emptyTitle: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 7,
  },
  emptyBody: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 18,
  },
});
