import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

import { colors, font, space } from '@shared/theme';
import { Card, GroupLabel, Insight, FootNote } from '@shared/components/ui';
import {
  StepBars,
  WeightTrend,
  ConsistencyGrid,
} from '@shared/components/charts';
import { useActivity } from '@today/ActivityContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays, monthName } from '@shared/utils/date';
import { useBackend } from '@shared/state/BackendContext';
import { averageIntake, type IntakeAverage } from '@food/models';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { useSettings } from '@settings/SettingsContext';
import WaterTrendCard from '@water/WaterTrendCard';
import { useUnits } from '@settings/useUnits';
import {
  RANGE_DAYS,
  bucketSteps,
  longestProtectedRun,
  summarizeSteps,
  weightTrendFor,
  type StepRange,
} from './models';
import type { TrendsStackParamList } from './types';

type Props = NativeStackScreenProps<TrendsStackParamList, 'TrendsHome'>;

const RANGES = ['Week', 'Month', '6 months'] as const;
const RANGE_LABEL = {
  Week: 'this week',
  Month: 'this month',
  '6 months': 'over 6 months',
} as const;

export default function TrendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<StepRange>('Month');
  const { foodLog } = useFood();
  const { weightEntries, weightTrend } = useWeight();
  const { settings } = useSettings();
  const { formatWeight, toDisplay, weightLabel } = useUnits();
  const { food } = useBackend();
  const [intake, setIntake] = useState<IntakeAverage | null>(null);

  const { days, status: stepsStatus } = useActivity();
  const todayKey = useDayKey();
  // Food averages cover the last week, or the last 30 days for longer ranges
  // (a longer window would mean loading a lot of rows for little gain).
  const foodDays = range === 'Week' ? 7 : 30;
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      food
        .history(addDays(todayKey, -(foodDays - 1)), todayKey)
        .then(
          (byDay) => !cancelled && setIntake(averageIntake(byDay, todayKey)),
        )
        .catch((e) => console.warn('Could not load food history', e));
      return () => {
        cancelled = true;
      };
      // foodLog is a trigger, not an input: reload after something is logged.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [food, todayKey, foodDays, foodLog]),
  );
  const stepsConnected = stepsStatus === 'connected';
  const rangeSteps = summarizeSteps(days, RANGE_DAYS[range]);
  const bars = bucketSteps(days, range);
  const inRange = days.slice(-RANGE_DAYS[range]).map((d) => d.state);
  const longestRun = longestProtectedRun(inRange);
  const rangeTrend = weightTrendFor(weightEntries, RANGE_DAYS[range]);
  const latest = weightTrend[weightTrend.length - 1];
  const delta =
    rangeTrend.length > 1
      ? rangeTrend[rangeTrend.length - 1] - rangeTrend[0]
      : 0;
  const hasWeightTrend = rangeTrend.length >= 2;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Text style={s.eyebrow}>{monthName(todayKey)}</Text>
        <Text style={s.title}>Trends</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 100,
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

        {/* steps */}
        <Pressable onPress={() => navigation.navigate('StepsDetail')}>
          <Card style={{ marginBottom: space.md }}>
            <View style={s.metricTop}>
              <View style={s.metricText}>
                <Text style={s.metricName}>Steps</Text>
                <Text style={s.metricValue}>
                  {rangeSteps.average === null
                    ? '—'
                    : rangeSteps.average.toLocaleString()}
                </Text>
                <Text
                  style={s.metricSub}
                >{`daily average ${RANGE_LABEL[range]}`}</Text>
              </View>
              {rangeSteps.changePct !== null ? (
                <View
                  style={[s.delta, { backgroundColor: colors.glacierTint }]}
                >
                  <Text style={[s.deltaText, { color: colors.glacierDeep }]}>
                    {rangeSteps.changePct > 0
                      ? '+'
                      : rangeSteps.changePct < 0
                        ? '−'
                        : ''}
                    {Math.abs(rangeSteps.changePct)}%
                  </Text>
                </View>
              ) : null}
            </View>
            {stepsConnected ? (
              <StepBars
                days={bars}
                goal={settings.stepGoal}
                showLabels={range !== 'Month'}
              />
            ) : (
              <Text style={s.metricSub}>
                Connect step data in Settings → Health data to see this.
              </Text>
            )}
          </Card>
        </Pressable>

        {/* weight */}
        <Pressable onPress={() => navigation.navigate('WeightDetail')}>
          <Card style={{ marginBottom: space.md }}>
            {hasWeightTrend ? (
              <>
                <View style={s.metricTop}>
                  <View style={s.metricText}>
                    <Text style={s.metricName}>Weight</Text>
                    <Text style={s.metricValue}>{formatWeight(latest)}</Text>
                    <Text style={s.metricSub}>
                      7-day average ·{' '}
                      {toDisplay(latest - settings.weightGoalLb).toFixed(1)}{' '}
                      {weightLabel} from goal
                    </Text>
                  </View>
                  <View
                    style={[s.delta, { backgroundColor: colors.waterTint }]}
                  >
                    <Text style={[s.deltaText, { color: colors.water }]}>
                      {delta > 0 ? '+' : '−'}
                      {toDisplay(Math.abs(delta)).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <WeightTrend
                  trend={rangeTrend.map(toDisplay)}
                  spread={toDisplay(1.3)}
                  goal={toDisplay(settings.weightGoalLb)}
                />
                <Text style={s.legendNote}>
                  The shaded band is your day-to-day spread — normal
                  fluctuation, not change.
                </Text>
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
                <Text style={s.emptyTitle}>Not enough weigh-ins here yet</Text>
                <Text style={s.emptyBody}>
                  {`A trend needs at least two weigh-ins in this range, and you have ${rangeTrend.length}.`}
                  {weightEntries.length > rangeTrend.length
                    ? ' Try a longer range.'
                    : ' Tern can then draw a line that filters out daily noise.'}
                </Text>
              </View>
            )}
          </Card>
        </Pressable>

        {/* nutrition: part of "Track calories & macros", so gone when that is off */}
        {settings.trackCalories ? (
        <Card style={{ marginBottom: space.md }}>
          <Text style={s.metricName}>Calories</Text>
          <Text style={s.metricValue}>
            {intake ? intake.calories.toLocaleString() : '—'}
          </Text>
          <Text style={s.metricSub}>
            {intake
              ? `daily average · last ${foodDays} days`
              : 'no food logged yet'}
            {` · target ${settings.calorieTarget.toLocaleString()}`}
          </Text>
          <View style={s.macroRow}>
            <MacroBox
              value={intake ? `${intake.protein}g` : '—'}
              label='protein'
              bg={colors.kelpTint}
              color={colors.kelp}
            />
            <MacroBox
              value={intake ? `${intake.carbs}g` : '—'}
              label='carbs'
              bg={colors.glacierTint}
              color={colors.glacierDeep}
            />
            <MacroBox
              value={intake ? `${intake.fat}g` : '—'}
              label='fat'
              bg={colors.sunTint}
              color={colors.sunDeep}
            />
          </View>
        </Card>
        ) : null}

        {settings.trackWater ? <WaterTrendCard range={range} /> : null}

        <GroupLabel>Consistency</GroupLabel>
        <Card>
          <Text style={s.metricSub}>
            {range === '6 months'
              ? 'Last 6 months'
              : `Last ${RANGE_DAYS[range]} days`}
          </Text>
          <ConsistencyGrid days={inRange} />
        </Card>

        {longestRun > 1 ? (
          <Insight
            icon={
              <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
                <Path
                  d='M3 17l6-6 4 4 8-8'
                  stroke={colors.aurora}
                  strokeWidth={2}
                  strokeLinecap='round'
                />
              </Svg>
            }
          >
            {`Your longest stretch in this period is ${longestRun} days, rest days included.`}
          </Insight>
        ) : null}

        <FootNote>
          Averages smooth out day-to-day noise. Single-day weight changes are
          mostly water and rarely meaningful.
        </FootNote>
      </ScrollView>
    </View>
  );
}

function MacroBox({
  value,
  label,
  bg,
  color,
}: {
  value: string;
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[s.macroBox, { backgroundColor: bg }]}>
      <Text style={[s.macroValue, { color }]}>{value}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  title: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
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
  metricName: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  metricText: { flexShrink: 1 },
  metricValue: {
    fontFamily: font.displayMedium,
    fontSize: 24,
    color: colors.ink,
  },
  metricSub: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
  delta: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  deltaText: { fontFamily: font.semibold, fontSize: 11 },
  legendNote: {
    fontFamily: font.body,
    fontSize: 10.5,
    color: colors.ink3,
    marginTop: 6,
    lineHeight: 15,
  },
  macroRow: { flexDirection: 'row', gap: 6, marginTop: space.sm + 1 },
  macroBox: { flex: 1, borderRadius: 9, padding: 8, alignItems: 'center' },
  macroValue: { fontFamily: font.bold, fontSize: 13.5 },
  macroLabel: { fontFamily: font.body, fontSize: 9, color: colors.ink2 },
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
