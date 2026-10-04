import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { TrendRanges, TrendRange } from '@shared/models/trendRange';
import { Card, GroupLabel, PushHeader, Row, FootNote, LegendDot, SegmentedControl } from '@shared/components/ui';
import { StepBars } from '@shared/components/charts/StepBars';
import { ConsistencyGrid } from '@shared/components/charts/ConsistencyGrid';
import { useActivity } from '@today/ActivityContext';
import { weekdayName } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { bucketSteps } from '@trends/models/stepBars';
import { longestProtectedRun, summarizeSteps } from '@trends/models/stepsSummary';
import type { TrendsStackParamList } from '@trends/navigation';
import { StepsStatus } from '@today/data/steps.repository';
import { DayState } from '@shared/models/dayState';

type Props = NativeStackScreenProps<TrendsStackParamList, 'StepsDetail'>;


export default function StepsDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>(TrendRange.Month);
  const { settings } = useSettings();

  const { days, status } = useActivity();
  const connected = status === StepsStatus.Connected;

  const inRange = days.slice(-TrendRanges.DAYS[range]);
  const { average } = summarizeSteps(days, TrendRanges.DAYS[range]);
  const goalDays = inRange.filter((d) => d.state === DayState.Goal).length;
  const restDays = inRange.filter((d) => d.state === DayState.Rest).length;
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
    range === TrendRange.Week ? 'this week' : range === TrendRange.Month ? 'this month' : 'over 6 months';

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
        <SegmentedControl options={TrendRanges.ALL} value={range} onChange={setRange} style={s.seg} />

        <Card style={{ marginBottom: space.md }}>
          <Text style={s.metricValue}>
            {average === null ? '—' : average.toLocaleString()}
          </Text>
          <Text style={s.metricSub}>daily average {rangeLabel}</Text>
          {connected ? (
            <StepBars days={bars} goal={settings.stepGoal} height={88} showLabels={range !== TrendRange.Month} />
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
            {range === TrendRange.SixMonths ? 'Last 6 months' : `Last ${TrendRanges.DAYS[range]} days`}
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

const s = StyleSheet.create({
  seg: {
    marginVertical: space.md,
  },
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
});
