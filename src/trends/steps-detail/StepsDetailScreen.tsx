import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@shared/theme';
import { TrendRanges, TrendRange } from '../models/trendRange';
import {
  Card,
  GroupLabel,
  Row,
  FootNote,
  PushHeader,
  SegmentedControl,
} from '@shared/components/ui';
import { LegendDot } from '../components/LegendDot';
import { StepBars } from '../components/StepBars';
import { ConsistencyGrid } from '../components/ConsistencyGrid';
import { useActivity } from '../../domain/activity/ActivityContext';
import { weekdayName } from '@shared/utils/date';
import { useSettings } from '../../domain/settings/SettingsContext';
import { bucketSteps } from '../models/stepBars';
import { longestProtectedRun, summarizeSteps } from '../models/stepsSummary';
import type { TrendsStackParamList } from '../navigation';
import { noStepsNote } from '../models/noStepsNote';
import { DayState } from '@shared/models/dayState';

type Props = NativeStackScreenProps<TrendsStackParamList, 'StepsDetail'>;

export default function StepsDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>(TrendRange.Month);
  const { settings } = useSettings();

  const { days, status, stepsReadable } = useActivity();

  const inRange = days.slice(-TrendRanges.DAYS[range]);
  const { average } = summarizeSteps(days, TrendRanges.DAYS[range]);
  // A rest day on which the goal was reached anyway counts as a goal day here.
  const goalDays = inRange.filter((d) => d.reachedGoal).length;
  const restDays = inRange.filter(
    (d) => d.state === DayState.Rest && !d.reachedGoal,
  ).length;
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
    range === TrendRange.Week
      ? 'this week'
      : range === TrendRange.Month
        ? 'this month'
        : 'over 6 months';

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
        <SegmentedControl
          options={TrendRanges.ALL}
          value={range}
          onChange={setRange}
          style={s.seg}
        />

        <Card style={{ marginBottom: space.md }}>
          <Text style={s.metricValue}>
            {average === null ? '—' : average.toLocaleString()}
          </Text>
          <Text style={s.metricSub}>daily average {rangeLabel}</Text>
          {stepsReadable ? (
            <StepBars
              days={bars}
              goal={settings.stepGoal}
              height={88}
              showLabels={range !== TrendRange.Month}
            />
          ) : (
            <Text style={s.metricSub}>
              {noStepsNote(status, settings.healthData.readSteps)}
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
            {range === TrendRange.SixMonths
              ? 'Last 6 months'
              : `Last ${TrendRanges.DAYS[range]} days`}
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
  metricSub: typography.caption,
  statGrid: { flexDirection: 'row', gap: 8, marginTop: space.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.sm + 2,
    padding: 9,
    alignItems: 'center',
  },
  statVal: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  statLabel: typography.small,
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 14,
    marginTop: space.sm,
  },
});
