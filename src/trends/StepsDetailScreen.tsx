import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import {
  Card,
  GroupLabel,
  PushHeader,
  Row,
  FootNote,
} from '@shared/components/ui';
import { StepBars, ConsistencyGrid } from '@shared/components/charts';
import { weekBars, monthConsistency } from '@today/mock';
import { useSettings } from '@settings/SettingsContext';
import { longestProtectedRun } from './models';
import type { TrendsStackParamList } from './types';

type Props = NativeStackScreenProps<TrendsStackParamList, 'StepsDetail'>;

const RANGES = ['Week', 'Month', '6 months'] as const;

export default function StepsDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<(typeof RANGES)[number]>('Month');
  const { settings } = useSettings();

  const avgSteps = Math.round(
    weekBars.reduce((a, b) => a + b.value, 0) / weekBars.length,
  );
  const goalDays = monthConsistency.filter((d) => d === 'goal').length;
  const restDays = monthConsistency.filter((d) => d === 'rest').length;
  const longestRun = longestProtectedRun(monthConsistency);

  const best = weekBars.reduce((a, b) => (b.value > a.value ? b : a));
  const quietest = weekBars.reduce((a, b) => (b.value < a.value ? b : a));
  const DAY_NAMES: Record<string, string> = {
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    F: 'Friday',
    S: 'Saturday',
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Steps'
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
          <Text style={s.metricValue}>{avgSteps.toLocaleString()}</Text>
          <Text style={s.metricSub}>daily average this week</Text>
          <StepBars days={weekBars} goal={settings.stepGoal} height={88} />

          <View style={s.statGrid}>
            <StatBox value={goalDays} label='goal days' />
            <StatBox value={restDays} label='rest days' />
            <StatBox value={longestRun} label='longest run' />
          </View>
        </Card>

        <GroupLabel>Consistency</GroupLabel>
        <Card>
          <Text style={s.metricSub}>Last 30 days</Text>
          <ConsistencyGrid days={monthConsistency} />
          <View style={s.legend}>
            <LegendDot color={colors.glacier} label='goal' />
            <LegendDot color={colors.glacierTint} label='partial' />
            <LegendDot
              color={colors.driftwoodTint}
              border={colors.driftwood}
              label='rest'
            />
          </View>
        </Card>

        <GroupLabel>This week</GroupLabel>
        <Card style={{ padding: 0 }}>
          <Row
            title={DAY_NAMES[best.label] ?? best.label}
            sub={`${best.value.toLocaleString()} steps — your strongest day`}
          />
          <Row
            title={DAY_NAMES[quietest.label] ?? quietest.label}
            sub={`${quietest.value.toLocaleString()} steps — your quietest`}
          />
        </Card>

        <FootNote>
          Patterns like these are just information — useful for planning, not a
          reason to push harder on a slow day.
        </FootNote>
      </ScrollView>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: string;
}) {
  return (
    <View style={s.legendItem}>
      <View
        style={[
          s.sw,
          { backgroundColor: color },
          border ? { borderWidth: 1, borderColor: border } : null,
        ]}
      />
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
  metricValue: {
    fontFamily: font.displayMedium,
    fontSize: 30,
    color: colors.ink,
  },
  metricSub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  statGrid: { flexDirection: 'row', gap: 8, marginTop: space.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.sm + 2,
    padding: 9,
    alignItems: 'center',
  },
  statVal: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  statLabel: { fontFamily: font.body, fontSize: 9.5, color: colors.ink2 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 14,
    marginTop: space.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 9, height: 9, borderRadius: 2 },
  legendText: { fontFamily: font.body, fontSize: 10, color: colors.ink2 },
});
