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
import { useActivity } from '@today/ActivityContext';
import { weekdayName } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import {
  RANGE_DAYS,
  bucketSteps,
  longestProtectedRun,
  summarizeSteps,
  type StepRange,
} from './models';
import type { TrendsStackParamList } from './types';

type Props = NativeStackScreenProps<TrendsStackParamList, 'StepsDetail'>;

const RANGES = ['Week', 'Month', '6 months'] as const;

export default function StepsDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<StepRange>('Month');
  const { settings } = useSettings();

  const { days, status } = useActivity();
  const connected = status === 'connected';

  const inRange = days.slice(-RANGE_DAYS[range]);
  const { average } = summarizeSteps(days, RANGE_DAYS[range]);
  const goalDays = inRange.filter((d) => d.state === 'goal').length;
  const restDays = inRange.filter((d) => d.state === 'rest').length;
  const longestRun = longestProtectedRun(inRange.map((d) => d.state));

  const last7 = days.slice(-7);
  const bars = bucketSteps(days, range);
  const withSteps = last7.filter((d) => d.steps > 0);
  const best = withSteps.reduce<(typeof last7)[number] | null>(
    (a, d) => (!a || d.steps > a.steps ? d : a),
    null,
  );
  const quietest = withSteps.reduce<(typeof last7)[number] | null>(
    (a, d) => (!a || d.steps < a.steps ? d : a),
    null,
  );
  const rangeLabel =
    range === 'Week' ? 'this week' : range === 'Month' ? 'this month' : 'over 6 months';

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
          <Text style={s.metricValue}>
            {average === null ? '—' : average.toLocaleString()}
          </Text>
          <Text style={s.metricSub}>daily average {rangeLabel}</Text>
          {connected ? (
            <StepBars days={bars} goal={settings.stepGoal} height={88} showLabels={range !== 'Month'} />
          ) : (
            <Text style={s.metricSub}>
              Connect step data in Settings → Health data to see this.
            </Text>
          )}

          <View style={s.statGrid}>
            <StatBox value={goalDays} label='goal days' />
            <StatBox value={restDays} label='rest days' />
            <StatBox value={longestRun} label='longest run' />
          </View>
        </Card>

        <GroupLabel>Consistency</GroupLabel>
        <Card>
          <Text style={s.metricSub}>
            {range === '6 months' ? 'Last 6 months' : `Last ${RANGE_DAYS[range]} days`}
          </Text>
          <ConsistencyGrid days={inRange.map((d) => d.state)} />
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

        {best && quietest ? (
          <>
            <GroupLabel>This week</GroupLabel>
            <Card style={{ padding: 0 }}>
              <Row
                title={weekdayName(best.day)}
                sub={`${best.steps.toLocaleString()} steps — your strongest day`}
              />
              <Row
                title={weekdayName(quietest.day)}
                sub={`${quietest.steps.toLocaleString()} steps — your quietest`}
              />
            </Card>
          </>
        ) : null}

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
