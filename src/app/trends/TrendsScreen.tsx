import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { colors, font, space, typography } from '@/shared/theme';
import { TrendRanges, TrendRange } from '@/trends/models/trendRange';
import { Card, GroupLabel, Insight, FootNote } from '@/shared/components/ui/Layout';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Icon } from '@/shared/components/ui/Icon';
import { TrendCard, TrendFigure, TrendHeader } from '@/trends/components/TrendCard/TrendCard';
import { StepBars } from '@/trends/components/StepBars/StepBars';
import { WeightTrend } from '@/shared/components/WeightTrend/WeightTrend';
import { ConsistencyGrid } from '@/trends/components/ConsistencyGrid/ConsistencyGrid';
import { useActivity } from '@/domain/activity/ActivityContext';
import { useDayKey } from '@/shared/hooks/useDayKey';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { addDays, monthName } from '@/shared/utils/date';
import { averageIntake, type IntakeAverage } from '@/trends/models/intake';
import { useFood } from '@/domain/food/FoodContext';
import { useWeight } from '@/domain/weight/WeightContext';
import { useWater } from '@/domain/water/WaterContext';
import { useMood } from '@/domain/mood/MoodContext';
import { useMovement } from '@/domain/movement/MovementContext';
import { signedChange } from '@/domain/weight/models/weightEntry';
import { useSettings } from '@/domain/settings/SettingsContext';
import WaterTrendCard from '@/trends/components/WaterTrendCard/WaterTrendCard';
import { MovementTrendCard } from '@/trends/components/MovementTrendCard/MovementTrendCard';
import { EnergyTrendCard } from '@/trends/components/EnergyTrendCard/EnergyTrendCard';
import MoodTrendCard from '@/trends/components/MoodTrendCard/MoodTrendCard';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { bucketSteps } from '@/trends/models/stepBars';
import { longestProtectedRun, summarizeSteps } from '@/trends/models/stepsSummary';
import { weightTrendFor } from '@/trends/models/weightTrend';
import type { TrendsStackParamList } from '@/trends/navigation';
import { StepsStatus } from '@/domain/activity/steps.repository';

type Props = NativeStackScreenProps<TrendsStackParamList, 'TrendsHome'>;

export default function TrendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>(TrendRange.Month);
  const { foodLog, loadHistory, reload: reloadFood } = useFood();
  const { weightEntries, weightTrend, reload: reloadWeight } = useWeight();
  const { settings } = useSettings();
  const { formatWeight, toDisplay, weightLabel } = useUnits();
  const [intake, setIntake] = useState<IntakeAverage | null>(null);

  const { days, status: stepsStatus, refresh: refreshSteps } = useActivity();
  const { reload: reloadWater } = useWater();
  const { reload: reloadMood } = useMood();
  const { reload: reloadMovement } = useMovement();
  // Bumped after a pull, so the history read for the range is read again too.
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshControl = usePullToRefresh([
    async () => {
      await Promise.allSettled([
        refreshSteps(),
        reloadFood(),
        reloadWeight(),
        reloadWater(),
        reloadMood(),
        reloadMovement(),
      ]);
      setRefreshKey((k) => k + 1);
    },
  ]);
  const todayKey = useDayKey();
  // Food averages cover the last week, or the last 30 days for longer ranges
  // (a longer window would mean loading a lot of rows for little gain).
  const foodDays = range === TrendRange.Week ? 7 : 30;
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadHistory(addDays(todayKey, -(foodDays - 1)), todayKey)
        .then(
          (byDay) => !cancelled && setIntake(averageIntake(byDay, todayKey)),
        )
        .catch((e) => console.warn('Could not load food history', e));
      return () => {
        cancelled = true;
      };
      // foodLog and refreshKey are triggers, not inputs: reload after something is logged or a pull.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadHistory, todayKey, foodDays, foodLog, refreshKey]),
  );
  const stepsConnected = stepsStatus === StepsStatus.Connected;
  const rangeSteps = summarizeSteps(days, TrendRanges.DAYS[range]);
  const bars = bucketSteps(days, range);
  const inRange = days.slice(-TrendRanges.DAYS[range]).map((d) => d.state);
  const longestRun = longestProtectedRun(inRange);
  const rangeTrend = weightTrendFor(weightEntries, TrendRanges.DAYS[range]);
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
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 100,
        }}
      >
        <SegmentedControl options={TrendRanges.ALL} value={range} onChange={setRange} style={s.seg} />

        {/* steps */}
        <TrendCard onPress={() => navigation.navigate('StepsDetail')}>
          <TrendHeader
            title='Steps'
            value={rangeSteps.average === null ? '—' : rangeSteps.average.toLocaleString()}
            sub={`daily average ${TrendRanges.LABEL[range]}`}
            delta={
              rangeSteps.changePct === null
                ? null
                : {
                    text: `${rangeSteps.changePct > 0 ? '+' : rangeSteps.changePct < 0 ? '−' : ''}${Math.abs(rangeSteps.changePct)}%`,
                    bg: colors.glacierTint,
                    color: colors.glacierDeep,
                  }
            }
          />
          {stepsConnected ? (
            <StepBars days={bars} goal={settings.stepGoal} showLabels={range !== TrendRange.Month} />
          ) : (
            <Text style={s.note}>Connect step data in Settings → Health data to see this.</Text>
          )}
        </TrendCard>

        {/* weight: gone when weight isn't tracked */}
        {settings.trackWeight ? (
        <TrendCard onPress={() => navigation.navigate('WeightDetail')}>
            {hasWeightTrend ? (
              <>
                <TrendHeader
                  title='Weight'
                  value={formatWeight(latest)}
                  sub={
                    settings.weightGoalLb === null
                      ? '7-day average'
                      : `7-day average · ${Math.abs(toDisplay(latest - settings.weightGoalLb)).toFixed(1)} ${weightLabel} from goal`
                  }
                  delta={{ text: signedChange(toDisplay(delta)), bg: colors.waterTint, color: colors.water }}
                />
                <WeightTrend
                  trend={rangeTrend.map(toDisplay)}
                  spread={toDisplay(1.3)}
                  goal={
                    settings.weightGoalLb === null
                      ? undefined
                      : toDisplay(settings.weightGoalLb)
                  }
                />
                <Text style={s.legendNote}>
                  The shaded band is your day-to-day spread — normal
                  fluctuation, not change.
                </Text>
              </>
            ) : (
              <View style={s.emptyWeight}>
                <Icon name='chart-bar' size={36} color={colors.dove} />
                <Text style={s.emptyTitle}>Not enough weigh-ins here yet</Text>
                <Text style={s.emptyBody}>
                  {`A trend needs at least two weigh-ins in this range, and you have ${rangeTrend.length}.`}
                  {weightEntries.length > rangeTrend.length
                    ? ' Try a longer range.'
                    : ' Tern can then draw a line that filters out daily noise.'}
                </Text>
              </View>
            )}
        </TrendCard>
        ) : null}

        {/* nutrition: part of "Track calories & macros", so gone when that is off */}
        {settings.trackCalories ? (
        <TrendCard title='Calories'>
          <TrendFigure
            value={intake ? intake.calories.toLocaleString() : '—'}
            sub={`${intake ? `daily average · last ${foodDays} days` : 'no food logged yet'} · target ${settings.calorieTarget.toLocaleString()}`}
          />
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
        </TrendCard>
        ) : null}

        {settings.adaptTarget && settings.trackCalories && settings.trackWeight ? <EnergyTrendCard refreshKey={refreshKey} /> : null}
        {settings.trackMovement ? <MovementTrendCard range={range} refreshKey={refreshKey} /> : null}
        {settings.trackWater ? <WaterTrendCard range={range} refreshKey={refreshKey} /> : null}

        {settings.trackMood ? <MoodTrendCard range={range} /> : null}

        <GroupLabel>Consistency</GroupLabel>
        <Card>
          <Text style={s.note}>
            {range === TrendRange.SixMonths
              ? 'Last 6 months'
              : `Last ${TrendRanges.DAYS[range]} days`}
          </Text>
          <ConsistencyGrid days={inRange} />
        </Card>

        {longestRun > 1 ? (
          <Insight
            icon={
              <Icon name='trending-up' size={15} color={colors.aurora} />
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
  eyebrow: typography.meta,
  title: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  seg: {
    marginVertical: space.md,
  },
  note: typography.small,
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
