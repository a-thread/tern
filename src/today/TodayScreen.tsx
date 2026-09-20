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
import { useDayKey } from '@shared/hooks/useDayKey';
import { formatLongDate, weekdayLetter, weekdayName } from '@shared/utils/date';
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
import { dayTotals } from '@food/models';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { formatLoggedAt } from '@weight/models';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/useUnits';
import { waypointRules } from '@journey/models';
import { useWaypoints, type Celebration } from '@journey/WaypointsContext';
import WaypointBurst from '@journey/WaypointBurst';
import { leftToDo } from './models';
import { useActivity } from './ActivityContext';
import { greetingFor, type DayRecord } from './models';

const REST_DAY_POINTS =
  waypointRules.find((r) => r.id === 'rest')?.points ?? 10;

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
  const todayKey = useDayKey();
  const greeting = greetingFor();
  const {
    todaySteps,
    streak,
    week,
    status: stepsStatus,
    restLeft,
    todayIsRest,
    takeRestDay,
    undoRestDay,
  } = useActivity();
  const { waypoints, celebrations, pendingPoints, completeCelebration } =
    useWaypoints();
  const lastWeight = weightEntries[0];
  const progress = todaySteps / settings.stepGoal;
  const remaining = Math.max(settings.stepGoal - todaySteps, 0);
  const totals = dayTotals(foodLog);
  const reached = progress >= 1;
  const openItems = leftToDo(foodLog, lastWeight);
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
  const animatedSteps = useCountUp(todaySteps, replayKey);
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
      origin.y = Math.min(
        Math.max(origin.y, insets.top + 90),
        root.height - 160,
      );
      setPlaying({
        celebration: nextCelebration,
        origin,
        target: inRoot(chip),
      });
      starting.current = false;
    })();
  }, [isFocused, playing, nextCelebration, insets.top]);

  const openRestDay = (d: DayRecord) => {
    navigation.navigate('RestDay', {
      dayName: weekdayName(d.day),
      steps: d.steps,
      waypoints: REST_DAY_POINTS,
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
          <Text style={s.eyebrow}>{formatLongDate(todayKey)}</Text>
          <Text style={s.title}>Today</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            onPress={() =>
              navigation.navigate('Reward', {
                kind: 'goal',
                title: 'Waypoints so far',
                subtitle:
                  streak > 0 ? `${streak}-day streak` : 'Every step counts',
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
              <Text style={s.greeting}>
                {settings.firstName
                  ? `${greeting}, ${settings.firstName}`
                  : greeting}
              </Text>
              {streak > 0 ? (
                <View style={s.streakChip}>
                  <Text style={s.streakText}>
                    ☀ {streak} {streak === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              ) : null}
            </View>

            <FlightPath progress={progress} replayKey={replayKey} />

            <Text style={s.stepBig}>{animatedSteps.toLocaleString()}</Text>
            <Text style={s.stepSub}>
              {stepsStatus !== 'connected'
                ? "Steps aren't connected yet"
                : reached
                  ? `Goal reached · ${settings.stepGoal.toLocaleString()} steps`
                  : `${remaining.toLocaleString()} to go`}
            </Text>
          </LinearGradient>
        </View>

        <View style={s.weekRow}>
          {week.map((d, i) => (
            <Pressable
              key={d.day}
              onPress={d.state === 'rest' ? () => openRestDay(d) : undefined}
              disabled={d.state !== 'rest'}
            >
              <DayRing
                progress={d.goal > 0 ? Math.min(d.steps / d.goal, 1) : 0}
                replayKey={replayKey}
                delay={i * 80}
                label={weekdayLetter(d.day)}
                rest={d.state === 'rest'}
                today={d.isToday}
              />
            </Pressable>
          ))}
        </View>
        <Text style={s.caption}>
          {restCaption(week)} Streaks don't break for rest days.
        </Text>
        {todayIsRest ? (
          <Pressable onPress={undoRestDay} hitSlop={8}>
            <Text style={s.restLink}>Undo today's rest day</Text>
          </Pressable>
        ) : restLeft > 0 && !reached ? (
          <Pressable onPress={takeRestDay} hitSlop={8}>
            <Text style={s.restLink}>
              Take today as a rest day · {restLeft} left this week
            </Text>
          </Pressable>
        ) : null}

        {openItems.length ? (
          <>
            <GroupLabel>Left to do</GroupLabel>
            <Group>
              {openItems.map((item) =>
                item.kind === 'meal' ? (
                  <Row
                    key='meal'
                    title={item.title}
                    sub={item.sub}
                    onPress={() =>
                      navigation.navigate('LogFood', { meal: item.meal })
                    }
                    icon={
                      <IconBadge bg={colors.kelpTint}>
                        <Svg
                          width={14}
                          height={14}
                          viewBox='0 0 24 24'
                          fill='none'
                        >
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
                ) : (
                  <Row
                    key='weight'
                    title='Log weight'
                    sub={
                      lastWeight
                        ? `Last: ${formatWeight(lastWeight.lb)}, ${formatLoggedAt(lastWeight.loggedAt)}`
                        : 'No weight logged yet'
                    }
                    onPress={() => navigation.navigate('LogWeight')}
                    icon={
                      <IconBadge bg={colors.waterTint}>
                        <Svg
                          width={14}
                          height={14}
                          viewBox='0 0 24 24'
                          fill='none'
                        >
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
                ),
              )}
            </Group>
          </>
        ) : (
          <Card style={s.allDone}>
            <Text style={s.allDoneTitle}>All caught up</Text>
            <Text style={s.allDoneSub}>Nothing left for today.</Text>
          </Card>
        )}

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

/** "Wednesday was a rest day." / "Wednesday and Friday were rest days." / "Rest days are part of the route." */
function restCaption(week: DayRecord[]): string {
  const rests = week.filter((d) => d.state === 'rest' && !d.isToday);
  if (rests.length === 0) return 'Rest days are part of the route.';
  const names = rests.map((d) => weekdayName(d.day));
  if (names.length === 1) return `${names[0]} was a rest day.`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} were rest days.`;
}

const s = StyleSheet.create({
  restLink: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.driftwood,
    textAlign: 'center',
    marginTop: space.sm,
  },
  allDone: { alignItems: 'center', marginTop: space.md },
  allDoneTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  allDoneSub: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    marginTop: 2,
  },
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
