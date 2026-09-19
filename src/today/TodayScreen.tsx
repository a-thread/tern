import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space, skyFor } from '@shared/theme';
import {
  Group,
  GroupLabel,
  Row,
  IconBadge,
  Chip,
  MacroBar,
  Card,
} from '@shared/components/ui';
import { FlightPath, DayRing } from '@shared/components/charts';
import TernMark from '@shared/components/TernMark';
import {
  useAnimatedNumber,
  useCountUp,
  usePulseOnIncrease,
} from '@shared/hooks/useAnimatedNumber';
import type { RootStackParamList } from '@shared/navigation/types';
import { CORE_MEALS, dayTotals } from '@food/models';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { formatLoggedAt } from '@weight/models';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/useUnits';
import { profile } from '@settings/mock';
import { waypointRules } from '@journey/models';
import { useWaypoints, type Celebration } from '@journey/WaypointsContext';
import WaypointBurst from '@journey/WaypointBurst';
import { today, week, weekBars } from './mock';

const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const STEP_GOAL_POINTS =
  waypointRules.find((r) => r.id === 'steps')?.points ?? 40;

type Point = { x: number; y: number };
type Playing = { celebration: Celebration; origin: Point; target: Point };

function measureInWindow(ref: React.RefObject<View>) {
  return new Promise<{ x: number; y: number; width: number; height: number }>(
    (resolve) =>
      ref.current?.measureInWindow((x, y, width, height) =>
        resolve({ x, y, width, height }),
      ),
  );
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { foodLog } = useFood();
  const { weightEntries } = useWeight();
  const { settings } = useSettings();
  const { formatWeight } = useUnits();
  const {
    waypoints,
    addWaypoints,
    celebrations,
    pendingPoints,
    completeCelebration,
  } = useWaypoints();
  const lastWeight = weightEntries[0];
  const progress = today.steps / settings.stepGoal;
  const remaining = Math.max(settings.stepGoal - today.steps, 0);
  const totals = dayTotals(foodLog);
  const reached = progress >= 1;
  const mealsLoggedCount = CORE_MEALS.filter((m) =>
    foodLog.some((f) => f.meal === m),
  ).length;
  // The chip holds back awards that haven't been celebrated yet, so its
  // number ticks up (and pulses) as the feathers land on it.
  const shownWaypoints = Math.max(waypoints - pendingPoints, 0);
  const animatedWaypoints = useAnimatedNumber(shownWaypoints);

  // Replay the flight (and the step roll-up) every time Today comes into view.
  const [replayKey, setReplayKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setReplayKey((k) => k + 1);
    }, []),
  );
  const animatedSteps = useCountUp(today.steps, replayKey);
  const waypointsPulse = usePulseOnIncrease(shownWaypoints);

  // Play queued awards while Today is actually on screen — an award made in
  // the food-logging sheet waits here until you're back.
  const isFocused = useIsFocused();
  const rootRef = useRef<View>(null);
  const heroRef = useRef<View>(null);
  const chipRef = useRef<View>(null);
  const [playing, setPlaying] = useState<Playing | null>(null);
  const starting = useRef(false);
  const nextCelebration = celebrations[0];

  useEffect(() => {
    if (!isFocused || playing || starting.current || !nextCelebration) return;
    starting.current = true;
    (async () => {
      const [root, hero, chip] = await Promise.all([
        measureInWindow(rootRef),
        measureInWindow(heroRef),
        measureInWindow(chipRef),
      ]);
      const inRoot = (r: typeof hero): Point => ({
        x: r.x - root.x + r.width / 2,
        y: r.y - root.y + r.height / 2,
      });
      const origin = inRoot(hero);
      origin.y = Math.min(Math.max(origin.y, insets.top + 90), root.height - 160);
      setPlaying({
        celebration: nextCelebration,
        origin,
        target: inRoot(chip),
      });
      starting.current = false;
    })();
  }, [isFocused, playing, nextCelebration, insets.top]);

  const wasReached = useRef(reached);
  useEffect(() => {
    if (reached && !wasReached.current) {
      addWaypoints(STEP_GOAL_POINTS, 'steps');
    }
    wasReached.current = reached;
  }, [reached, addWaypoints]);

  const openRestDay = (i: number) => {
    navigation.navigate('RestDay', {
      dayName: WEEKDAY_NAMES[i] ?? week[i].label,
      steps: weekBars[i]?.value ?? 0,
      waypoints: waypointRules.find((r) => r.id === 'rest')?.points ?? 10,
    });
  };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>{today.date}</Text>
          <Text style={s.title}>Today</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            onPress={() =>
              navigation.navigate('Reward', {
                kind: 'goal',
                title: 'Waypoints so far',
                subtitle: `${today.streak}-day streak`,
                footer: 'Earned for showing up — never for weight or calories.',
              })
            }
          >
            <Animated.View
              ref={chipRef}
              collapsable={false}
              style={{ transform: [{ scale: waypointsPulse }] }}
            >
              <Chip bg={colors.violetTint} color={colors.violet}>
                <TernMark size={12} color={colors.violet} />
                <Text style={[s.chipText, { color: colors.violet }]}>
                  {animatedWaypoints.toLocaleString()}
                </Text>
              </Chip>
            </Animated.View>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            style={s.gearBtn}
          >
            <Svg
              width={19}
              height={19}
              viewBox='0 0 24 24'
              fill='none'
              stroke={colors.ink2}
              strokeWidth={2}
            >
              <Path d='M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' />
              <Path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
            </Svg>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 100,
        }}
      >
        <View ref={heroRef} collapsable={false}>
        <LinearGradient colors={skyFor(progress) as string[]} style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.greeting}>Morning, {profile.name}</Text>
            <View style={s.streakChip}>
              <Text style={s.streakText}>☀ {today.streak} days</Text>
            </View>
          </View>

          <FlightPath progress={progress} replayKey={replayKey} />

          <Text style={s.stepBig}>{animatedSteps.toLocaleString()}</Text>
          <Text style={s.stepSub}>
            {reached
              ? `Goal reached · ${settings.stepGoal.toLocaleString()} steps`
              : `${remaining.toLocaleString()} to go`}
          </Text>
        </LinearGradient>
        </View>

        <View style={s.weekRow}>
          {week.map((d, i) => (
            <Pressable
              key={i}
              onPress={d.rest ? () => openRestDay(i) : undefined}
              disabled={!d.rest}
            >
              <DayRing
                progress={d.progress}
                replayKey={replayKey}
                delay={i * 80}
                label={d.label}
                rest={d.rest}
                today={d.today}
              />
            </Pressable>
          ))}
        </View>
        <Text style={s.caption}>
          Wednesday was a rest day. Streaks don't break for those.
        </Text>

        <GroupLabel>Left to do</GroupLabel>
        <Group>
          <Row
            title='Log dinner'
            sub={`${mealsLoggedCount} of ${CORE_MEALS.length} meals logged`}
            onPress={() => navigation.navigate('LogFood', { meal: 'dinner' })}
            icon={
              <IconBadge bg={colors.kelpTint}>
                <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                  <Path
                    d='M2,12 C6,6 14,6 18,12 C14,18 6,18 2,12 Z'
                    stroke={colors.kelp}
                    strokeWidth={2}
                  />
                  <Path
                    d='M18,12 L22,8.5 L22,15.5 Z'
                    stroke={colors.kelp}
                    strokeWidth={2}
                  />
                </Svg>
              </IconBadge>
            }
            chevron
          />
          <Row
            title='Log weight'
            sub={
              lastWeight
                ? `Last: ${formatWeight(lastWeight.lb)},${formatLoggedAt(lastWeight.loggedAt)}`
                : 'No weight logged yet'
            }
            onPress={() => navigation.navigate('LogWeight')}
            icon={
              <IconBadge bg={colors.waterTint}>
                <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                  <Path
                    d='M6 5h12M9 5v2a3 3 0 1 0 6 0V5M7 19h10M9 19c0-4 1-6 3-7 2 1 3 3 3 7'
                    stroke={colors.water}
                    strokeWidth={2}
                  />
                </Svg>
              </IconBadge>
            }
            chevron
          />
        </Group>

        {settings.trackCalories ? (
          <>
            <GroupLabel>Nutrition today</GroupLabel>
            <Card>
              <MacroBar
                label='Protein'
                current={Math.round(totals.protein)}
                target={settings.macroTargets.protein}
                color={colors.kelp}
              />
              <MacroBar
                label='Carbs'
                current={Math.round(totals.carbs)}
                target={settings.macroTargets.carbs}
                color={colors.glacier}
              />
              <MacroBar
                label='Fat'
                current={Math.round(totals.fat)}
                target={settings.macroTargets.fat}
                color={colors.sun}
              />
            </Card>
          </>
        ) : null}
      </ScrollView>

      {playing ? (
        <WaypointBurst
          key={playing.celebration.id}
          id={playing.celebration.id}
          points={playing.celebration.points}
          label={
            waypointRules.find((r) => r.id === playing.celebration.source)
              ?.label ?? ''
          }
          origin={playing.origin}
          target={playing.target}
          onArrive={() => completeCelebration(playing.celebration.id)}
          onDone={() => setPlaying(null)}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  eyebrow: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  title: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gearBtn: { padding: 2 },
  chipText: { fontFamily: font.semibold, fontSize: 12 },
  hero: { borderRadius: radius.xl, padding: space.lg, marginTop: space.xs },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  greeting: { fontFamily: font.body, fontSize: 11.5, color: '#E4DCE4' },
  streakChip: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakText: { fontFamily: font.semibold, fontSize: 11.5, color: '#FBFAF7' },
  stepBig: {
    fontFamily: font.displayMedium,
    fontSize: 32,
    color: '#FBFAF7',
    textAlign: 'center',
    marginTop: 4,
  },
  stepSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: '#DCD4DE',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingHorizontal: 2,
  },
  caption: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: space.sm,
  },
});
