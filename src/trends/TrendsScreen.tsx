import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, space } from '@shared/theme';
import { Card, GroupLabel, Insight, FootNote } from '@shared/components/ui';
import {
  StepBars,
  WeightTrend,
  ConsistencyGrid,
} from '@shared/components/charts';
import { weekBars, monthConsistency } from '@today/mock';
import { dayTotals } from '@food/models';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { useSettings } from '@settings/SettingsContext';
import type { TrendsStackParamList } from './types';

type Props = NativeStackScreenProps<TrendsStackParamList, 'TrendsHome'>;

const RANGES = ['Week', 'Month', '6 months'] as const;
const WEIGHT_TREND_MIN_ENTRIES = 7;

export default function TrendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<(typeof RANGES)[number]>('Month');
  const { foodLog } = useFood();
  const { weightEntries, weightTrend } = useWeight();
  const { settings } = useSettings();
  const totals = dayTotals(foodLog);

  const avgSteps = Math.round(
    weekBars.reduce((a, b) => a + b.value, 0) / weekBars.length,
  );
  const latest = weightTrend[weightTrend.length - 1];
  const delta = latest - weightTrend[0];
  const hasWeightTrend = weightEntries.length >= WEIGHT_TREND_MIN_ENTRIES;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Text style={s.eyebrow}>September</Text>
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
              <View>
                <Text style={s.metricName}>Steps</Text>
                <Text style={s.metricValue}>{avgSteps.toLocaleString()}</Text>
                <Text style={s.metricSub}>daily average</Text>
              </View>
              <View style={[s.delta, { backgroundColor: colors.glacierTint }]}>
                <Text style={[s.deltaText, { color: colors.glacierDeep }]}>
                  +11%
                </Text>
              </View>
            </View>
            <StepBars days={weekBars} goal={settings.stepGoal} />
          </Card>
        </Pressable>

        {/* weight */}
        <Pressable onPress={() => navigation.navigate('WeightDetail')}>
          <Card style={{ marginBottom: space.md }}>
            {hasWeightTrend ? (
              <>
                <View style={s.metricTop}>
                  <View>
                    <Text style={s.metricName}>Weight</Text>
                    <Text style={s.metricValue}>{latest.toFixed(1)} kg</Text>
                    <Text style={s.metricSub}>
                      7-day average ·{' '}
                      {(latest - settings.weightGoalKg).toFixed(1)} kg from goal
                    </Text>
                  </View>
                  <View
                    style={[s.delta, { backgroundColor: colors.waterTint }]}
                  >
                    <Text style={[s.deltaText, { color: colors.water }]}>
                      {delta > 0 ? '+' : '−'}
                      {Math.abs(delta).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <WeightTrend
                  trend={weightTrend}
                  spread={0.6}
                  goalKg={settings.weightGoalKg}
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
                <Text style={s.emptyTitle}>Weight trends need a week</Text>
                <Text style={s.emptyBody}>
                  You've logged {weightEntries.length} time
                  {weightEntries.length === 1 ? '' : 's'} so far. After about{' '}
                  {WEIGHT_TREND_MIN_ENTRIES} entries, Tern can show a trend line
                  that filters out daily noise.
                </Text>
              </View>
            )}
          </Card>
        </Pressable>

        {/* nutrition */}
        <Card style={{ marginBottom: space.md }}>
          <Text style={s.metricName}>Calories</Text>
          <Text style={s.metricValue}>
            {Math.round(totals.calories).toLocaleString()}
          </Text>
          <Text style={s.metricSub}>
            daily average
            {settings.trackCalories
              ? ` · target ${settings.calorieTarget.toLocaleString()}`
              : ''}
          </Text>
          <View style={s.macroRow}>
            <MacroBox
              value={`${Math.round(totals.protein)}g`}
              label='protein'
              bg={colors.kelpTint}
              color={colors.kelp}
            />
            <MacroBox
              value={`${Math.round(totals.carbs)}g`}
              label='carbs'
              bg={colors.glacierTint}
              color={colors.glacierDeep}
            />
            <MacroBox
              value={`${Math.round(totals.fat)}g`}
              label='fat'
              bg={colors.sunTint}
              color={colors.sunDeep}
            />
          </View>
        </Card>

        <GroupLabel>Consistency</GroupLabel>
        <Card>
          <Text style={s.metricSub}>Last 30 days</Text>
          <ConsistencyGrid days={monthConsistency} />
        </Card>

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
          Nine days logged in a row — your most consistent stretch yet.
        </Insight>

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
  metricValue: {
    fontFamily: font.displayMedium,
    fontSize: 24,
    color: colors.ink,
    lineHeight: 30,
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
