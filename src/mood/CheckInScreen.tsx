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
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/charts';
import type { RootStackParamList } from '@shared/navigation/types';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import {
  DEFAULT_SCORE,
  MAX_SCORE,
  MIN_SCORE,
  average,
  clampScore,
  entriesBetween,
  scoreWord,
  seriesOf,
  type MoodMetric,
} from './models';
import { scoreColor, scoreTint, smile } from './scoreColor';
import MoodFace from './MoodFace';
import { useMood } from './MoodContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

const TICK_W = 18; // one whole score per tick, and the drag distance for a change of 1
const TICKS_EACH_SIDE = 10;
const RULER_H = 64;

const METRICS: { id: MoodMetric; label: string; hint: string }[] = [
  { id: 'mood', label: 'Mood', hint: '1 is very low, 10 is great.' },
  { id: 'stress', label: 'Stress', hint: '1 is calm, 10 is very high.' },
];

const PIPS = Array.from({ length: MAX_SCORE - MIN_SCORE + 1 }, (_, i) => MIN_SCORE + i);

export default function CheckInScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const today = useDayKey();
  const { entries, today: todays, checkIn, clearToday } = useMood();

  const last = entries[entries.length - 1];
  const start = (m: MoodMetric) => todays?.[m] ?? last?.[m] ?? DEFAULT_SCORE;
  const [scores, setScores] = useState({ mood: start('mood'), stress: start('stress') });
  const [active, setActive] = useState<MoodMetric>('mood');
  const scoresRef = useRef(scores);
  const activeRef = useRef(active);
  activeRef.current = active;

  const setScore = (metric: MoodMetric, v: number) => {
    const next = { ...scoresRef.current, [metric]: clampScore(v) };
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
  useEffect(() => {
    pop.setValue(0.82);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  }, [value, active, pop]);

  // Ticks swell toward the centre and take the colour of the score they stand for; ticks
  // beyond the ends of the scale are left blank.
  const ticks = useMemo(() => {
    const list: { v: number; d: number; visible: boolean }[] = [];
    for (let d = -TICKS_EACH_SIDE; d <= TICKS_EACH_SIDE; d++) {
      const v = value + d;
      list.push({ v, d, visible: v >= MIN_SCORE && v <= MAX_SCORE });
    }
    return list;
  }, [value]);

  const week = entriesBetween(entries, addDays(today, -6), today);
  const weekAvg = average(week, active);

  const save = () => {
    checkIn(scores.mood, scores.stress);
    navigation.goBack();
  };

  const remove = () => {
    clearToday();
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title='Check in'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={save}
      />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}
      >
        <View style={s.switch}>
          {METRICS.map((m) => {
            const on = active === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setActive(m.id)}
                style={[s.switchItem, on && { backgroundColor: scoreColor(m.id, scores[m.id]) }]}
                accessibilityRole='button'
                accessibilityState={{ selected: on }}
              >
                <Text style={[s.switchText, on && s.switchTextOn]}>{m.label}</Text>
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
              accessibilityLabel={`${meta.label} ${value} out of ${MAX_SCORE}`}
            >
              {value}
            </Text>
            <Text style={s.unit}>{`/ ${MAX_SCORE}`}</Text>
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
                          backgroundColor: scoreColor(active, t.visible ? t.v : value),
                        },
                      ]}
                    />
                    {t.visible ? (
                      <Text
                        style={[s.tickLabel, t.d === 0 && { color, fontFamily: font.semibold }]}
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

        <View style={s.pips} accessibilityLabel={`${meta.label} scale, tap a segment to set it`}>
          {PIPS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setScore(active, n)}
              hitSlop={{ top: 12, bottom: 12 }}
              style={[
                s.pip,
                { backgroundColor: n <= value ? scoreColor(active, n) : colors.doveTint },
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
              accessibilityLabel={`${d > 0 ? 'Raise' : 'Lower'} ${meta.label.toLowerCase()} by 1`}
            >
              <Text style={[s.stepText, { color }]}>{d > 0 ? '+1' : '−1'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.hint}>
          {meta.hint} There are no right answers. Tern only shows you the pattern over time.
        </Text>

        {weekAvg !== null ? (
          <>
            <GroupLabel>This week</GroupLabel>
            <View style={s.weekCard}>
              <View style={s.weekTop}>
                <Text style={s.weekVal}>{`${meta.label} ${weekAvg.toFixed(1)}`}</Text>
                <Text style={s.weekSub}>7-day average</Text>
              </View>
              <WeightTrend trend={seriesOf(week, active)} spread={0.5} height={44} />
            </View>
          </>
        ) : null}

        <GroupLabel>Details</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={s.rowTitle}>Date</Text>
            <Text style={s.rowSub}>Today</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowTitle}>Mood</Text>
            <Text style={[s.rowSub, { color: scoreColor('mood', scores.mood) }]}>
              {`${scores.mood} · ${scoreWord('mood', scores.mood)}`}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowTitle}>Stress</Text>
            <Text style={[s.rowSub, { color: scoreColor('stress', scores.stress) }]}>
              {`${scores.stress} · ${scoreWord('stress', scores.stress)}`}
            </Text>
          </View>
          {todays ? (
            <Pressable style={s.row} onPress={remove} accessibilityRole='button'>
              <Text style={[s.rowTitle, s.danger]}>Remove today’s check-in</Text>
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
  switchItem: { paddingHorizontal: 22, paddingVertical: 7, borderRadius: radius.md - 2 },
  switchText: { fontFamily: font.semibold, fontSize: 13, color: colors.ink2 },
  switchTextOn: { color: colors.card },
  hero: {
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    overflow: 'hidden',
  },
  display: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'center', marginTop: space.sm },
  val: {
    minWidth: 60,
    textAlign: 'center',
    fontFamily: font.displayMedium,
    fontSize: 52,
    lineHeight: 58,
  },
  unit: { fontFamily: font.body, fontSize: 15, color: colors.ink2, marginLeft: 5 },
  word: { fontFamily: font.semibold, fontSize: 14, marginBottom: space.sm },
  ruler: { height: RULER_H, width: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
  rulerTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: RULER_H - 6,
    width: TICK_W * (TICKS_EACH_SIDE * 2 + 1),
    alignSelf: 'center',
  },
  tickCol: { width: TICK_W, alignItems: 'center' },
  tick: { borderRadius: 3 },
  tickLabel: { position: 'absolute', top: 40, fontSize: 9.5, color: colors.ink3, fontFamily: font.body },
  pips: { flexDirection: 'row', gap: 5, marginTop: space.md },
  pip: { flex: 1, height: 12, borderRadius: 6 },
  pipCurrent: { transform: [{ scaleY: 1.5 }] },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginVertical: space.md,
  },
  stepBtn: { minWidth: 56, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md },
  stepText: { fontFamily: font.semibold, fontSize: 13.5 },
  hint: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  weekCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md + 1 },
  weekTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  weekVal: { fontFamily: font.displayMedium, fontSize: 19, color: colors.ink },
  weekSub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: { fontFamily: font.body, fontSize: 12, color: colors.ink2 },
  danger: { color: colors.coral },
});
