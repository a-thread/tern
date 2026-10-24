import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/WeightTrend';
import type { RootStackParamList } from '../navigation/types';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { addDays, dayWord } from '@shared/utils/date';
import {
  clampScore,
  scoreWord,
  MoodScale,
  MoodMetric,
} from '../domain/mood/models/moodEntry';
import {
  average,
  entriesBetween,
  seriesOf,
} from '../domain/mood/models/moodStats';
import { scoreColor, scoreTint, smile } from './utils/scoreColor';
import MoodFace from './components/MoodFace/MoodFace';
import { useMood } from '../domain/mood/MoodContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

const TICK_W = 18; // one whole score per tick, and the drag distance for a change of 1
const TICKS_EACH_SIDE = 10;
const RULER_H = 64;

const METRICS: { id: MoodMetric; label: string; hint: string }[] = [
  { id: MoodMetric.Mood, label: 'Mood', hint: '1 is very low, 10 is great.' },
  {
    id: MoodMetric.Stress,
    label: 'Stress',
    hint: '1 is calm, 10 is very high.',
  },
];

const PIPS = Array.from(
  { length: MoodScale.MAX - MoodScale.MIN + 1 },
  (_, i) => MoodScale.MIN + i,
);

export default function CheckInScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  // The viewed day: today, or yesterday when filling it in from a past day.
  const { day: today, today: realToday } = useViewedDay();
  const { entries, onDay: todays, checkIn, clearDay } = useMood();
  const dayLabel = dayWord(today, realToday);

  // A new check-in starts in the middle, not at the last one, so yesterday's score doesn't
  // anchor today's. Editing the day's own check-in starts from what was saved.
  const start = (m: MoodMetric) => todays?.[m] ?? MoodScale.DEFAULT;
  const [scores, setScores] = useState({
    mood: start(MoodMetric.Mood),
    stress: start(MoodMetric.Stress),
  });
  const [active, setActiveState] = useState<MoodMetric>(MoodMetric.Mood);
  // Stress sits behind the switch, so a new check-in doesn't count it as answered until it has
  // been looked at or moved; otherwise Save would quietly store the starting score.
  const [stressSet, setStressSet] = useState(todays !== undefined);
  const scoresRef = useRef(scores);
  const activeRef = useRef(active);
  activeRef.current = active;

  const setActive = (metric: MoodMetric) => {
    if (metric === MoodMetric.Stress) setStressSet(true);
    setActiveState(metric);
  };

  const setScore = (metric: MoodMetric, v: number) => {
    const next = { ...scoresRef.current, [metric]: clampScore(v) };
    if (next[metric] !== scoresRef.current[metric]) Haptics.selectionAsync();
    scoresRef.current = next;
    setScores(next);
  };

  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStart.current = scoresRef.current[activeRef.current];
      },
      onPanResponderMove: (_evt, gesture) => {
        setScore(activeRef.current, dragStart.current - gesture.dx / TICK_W);
      },
    }),
  ).current;

  const value = scores[active];
  const meta = METRICS.find((m) => m.id === active)!;
  const color = scoreColor(active, value);

  // The number gives a small bounce each time the score changes (or the metric switches).
  const pop = useRef(new Animated.Value(1)).current;
  const still = useReduceMotion();
  useEffect(() => {
    if (still) return;
    pop.setValue(0.82);
    Animated.spring(pop, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [value, active, pop, still]);

  // Ticks swell toward the centre and take the colour of the score they stand for; ticks
  // beyond the ends of the scale are left blank.
  const ticks = useMemo(() => {
    const list: { v: number; d: number; visible: boolean }[] = [];
    for (let d = -TICKS_EACH_SIDE; d <= TICKS_EACH_SIDE; d++) {
      const v = value + d;
      list.push({ v, d, visible: v >= MoodScale.MIN && v <= MoodScale.MAX });
    }
    return list;
  }, [value]);

  const week = entriesBetween(entries, addDays(today, -6), today);
  const weekAvg = average(week, active);

  const save = () => {
    // The first press shows Stress rather than saving a score nobody chose.
    if (!stressSet) {
      setActive(MoodMetric.Stress);
      return;
    }
    checkIn(scores.mood, scores.stress);
    navigation.goBack();
  };

  const remove = () => {
    clearDay();
    navigation.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Check in'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel={stressSet ? 'Save' : 'Next'}
        onRightPress={save}
      />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.switch}>
          {METRICS.map((m) => {
            const on = active === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setActive(m.id)}
                style={[
                  s.switchItem,
                  on && { backgroundColor: scoreColor(m.id, scores[m.id]) },
                ]}
                accessibilityRole='button'
                accessibilityState={{ selected: on }}
                accessibilityLabel={
                  m.id === MoodMetric.Stress && !stressSet
                    ? `${m.label}, not set`
                    : m.label
                }
              >
                <Text style={[s.switchText, on && s.switchTextOn]}>
                  {m.label}
                </Text>
                {m.id === MoodMetric.Stress && !stressSet ? (
                  <View style={s.unsetDot} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <LinearGradient
          colors={[scoreTint(active, value), colors.card]}
          style={s.hero}
        >
          <MoodFace smile={smile(active, value)} color={color} />
          <Animated.View style={[s.display, { transform: [{ scale: pop }] }]}>
            <Text
              style={[s.val, { color }]}
              accessibilityLabel={`${meta.label} ${value} out of ${MoodScale.MAX}`}
            >
              {value}
            </Text>
            <Text style={s.unit}>{`/ ${MoodScale.MAX}`}</Text>
          </Animated.View>
          <Text style={[s.word, { color }]}>{scoreWord(active, value)}</Text>

          <View style={s.ruler} {...panResponder.panHandlers}>
            <View style={s.rulerTrack}>
              {ticks.map((t) => {
                const near = Math.exp(-(t.d * t.d) / 10); // 1 in the middle, fading outward
                return (
                  <View key={t.d} style={s.tickCol}>
                    <View
                      style={[
                        s.tick,
                        {
                          height: 12 + 34 * near,
                          width: t.d === 0 ? 6 : 3,
                          opacity: t.visible ? 0.25 + 0.75 * near : 0,
                          backgroundColor: scoreColor(
                            active,
                            t.visible ? t.v : value,
                          ),
                        },
                      ]}
                    />
                    {t.visible ? (
                      <Text
                        style={[
                          s.tickLabel,
                          t.d === 0 && { color, fontFamily: font.semibold },
                        ]}
                      >
                        {t.v}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </LinearGradient>

        <View
          style={s.pips}
          accessibilityLabel={`${meta.label} scale, tap a segment to set it`}
        >
          {PIPS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setScore(active, n)}
              hitSlop={{ top: 12, bottom: 12 }}
              style={[
                s.pip,
                {
                  backgroundColor:
                    n <= value ? scoreColor(active, n) : colors.doveTint,
                },
                n === value && s.pipCurrent,
              ]}
              accessibilityRole='button'
              accessibilityLabel={`Set ${meta.label.toLowerCase()} to ${n}`}
            />
          ))}
        </View>

        <View style={s.stepRow}>
          {[-1, 1].map((d) => (
            <Pressable
              key={d}
              onPress={() => setScore(active, scoresRef.current[active] + d)}
              style={[s.stepBtn, { backgroundColor: scoreTint(active, value) }]}
              accessibilityRole='button'
              accessibilityLabel={`${d > 0 ? 'Raise' : 'Lower'} ${meta.label.toLowerCase()} by 1`}
            >
              <Text style={[s.stepText, { color }]}>{d > 0 ? '+1' : '−1'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.hint}>
          {meta.hint} There are no right answers. Tern only shows you the
          pattern over time.
        </Text>

        {weekAvg !== null ? (
          <>
            <GroupLabel>This week</GroupLabel>
            <View style={s.weekCard}>
              <View style={s.weekTop}>
                <Text
                  style={s.weekVal}
                >{`${meta.label} ${weekAvg.toFixed(1)}`}</Text>
                <Text style={s.weekSub}>7-day average</Text>
              </View>
              <WeightTrend
                trend={seriesOf(week, active)}
                spread={0.5}
                height={44}
              />
            </View>
          </>
        ) : null}

        <GroupLabel>Details</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={s.rowTitle}>Date</Text>
            <Text style={s.rowSub}>{dayLabel}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowTitle}>Mood</Text>
            <Text
              style={[
                s.rowSub,
                { color: scoreColor(MoodMetric.Mood, scores.mood) },
              ]}
            >
              {`${scores.mood} · ${scoreWord(MoodMetric.Mood, scores.mood)}`}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowTitle}>Stress</Text>
            {stressSet ? (
              <Text
                style={[
                  s.rowSub,
                  { color: scoreColor(MoodMetric.Stress, scores.stress) },
                ]}
              >
                {`${scores.stress} · ${scoreWord(MoodMetric.Stress, scores.stress)}`}
              </Text>
            ) : (
              <Text style={s.rowSub}>Not set</Text>
            )}
          </View>
          {todays ? (
            <Pressable
              style={s.row}
              onPress={remove}
              accessibilityRole='button'
            >
              <Text
                style={[s.rowTitle, s.danger]}
              >{`Remove ${dayLabel.toLowerCase()}’s check-in`}</Text>
            </Pressable>
          ) : null}
        </Group>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  switch: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 3,
    marginTop: space.sm,
    marginBottom: space.md,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: radius.md - 2,
  },
  unsetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  switchText: { fontFamily: font.semibold, fontSize: 13, color: colors.ink2 },
  switchTextOn: { color: colors.card },
  hero: {
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    overflow: 'hidden',
  },
  display: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  val: {
    minWidth: 60,
    textAlign: 'center',
    fontFamily: font.displayMedium,
    fontSize: 52,
    lineHeight: 58,
  },
  unit: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink2,
    marginLeft: 5,
  },
  word: { fontFamily: font.semibold, fontSize: 14, marginBottom: space.sm },
  ruler: {
    height: RULER_H,
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  rulerTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: RULER_H - 6,
    width: TICK_W * (TICKS_EACH_SIDE * 2 + 1),
    alignSelf: 'center',
  },
  tickCol: { width: TICK_W, alignItems: 'center' },
  tick: { borderRadius: 3 },
  tickLabel: { ...typography.tick, position: 'absolute', top: 40 },
  pips: { flexDirection: 'row', gap: 5, marginTop: space.md },
  pip: { flex: 1, height: 12, borderRadius: 6 },
  pipCurrent: { transform: [{ scaleY: 1.5 }] },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginVertical: space.md,
  },
  stepBtn: {
    minWidth: 56,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  stepText: { fontFamily: font.semibold, fontSize: 13.5 },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  weekCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  weekTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weekVal: { fontFamily: font.displayMedium, fontSize: 19, color: colors.ink },
  weekSub: typography.caption,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: typography.rowTitle,
  rowSub: { fontFamily: font.body, fontSize: 12, color: colors.ink2 },
  danger: { color: colors.coral },
});
