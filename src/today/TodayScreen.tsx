import React, { useEffect, useRef, useState } from 'react';
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
import { useIsFocused, useNavigation } from '@react-navigation/native';
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
import { usePulseOnIncrease } from '@shared/hooks/useAnimatedNumber';
import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { AnimatedNumber, CountUp } from '@shared/components/AnimatedNumber';
import type { RootStackParamList } from '@shared/navigation/types';
import { dayTotals } from '@food/models';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { formatLoggedAt } from '@weight/models';
import { useSettings } from '@settings/SettingsContext';
import { formatMinutes } from '@settings/reminders.plan';
import { useUnits } from '@settings/useUnits';
import { useFoodDisplay } from '@food/useFoodDisplay';
import { useMedication } from '@medication/MedicationContext';
import { useWater } from '@water/WaterContext';
import { useMood } from '@mood/MoodContext';
import { scoreWord } from '@mood/models';
import { waypointRules } from '@journey/models';
import { useWaypoints, type Celebration } from '@journey/WaypointsContext';
import { usePendingMilestone } from '@journey/usePendingMilestone';
import WaypointBurst from '@journey/WaypointBurst';
import { leftToDo, todaySummary } from './models';
import { useActivity } from './ActivityContext';
import { greetingFor, type DayRecord } from './models';
import { factForDay } from './ternFacts';

const REST_DAY_POINTS =
  waypointRules.find((r) => r.id === 'rest')?.points ?? 10;

type Point = { x: number; y: number };
type Playing = { celebration: Celebration; origin: Point; target: Point };

function measureInWindow(ref: React.RefObject<View | null>) {
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
  const { foodLog, skippedMeals } = useFood();
  const { weightEntries } = useWeight();
  const { settings } = useSettings();
  const { formatWeight, formatVolume, quickWaterOz } = useUnits();
  const water = useWater();
  const mood = useMood();
  const { showCalories } = useFoodDisplay();
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
  const { due: dueMedications, taken: takenMedications, setTaken } = useMedication();
  const openItems = leftToDo(foodLog, lastWeight, new Date(), {
    weighIn: settings.trackWeight
      ? {
          frequency: settings.weighInFrequency,
          weekday: settings.reminders.weighIn.weekday,
        }
      : null,
    skippedMeals,
    medications: dueMedications,
    water: water.enabled ? { totalOz: water.totalOz, goalOz: water.goalOz } : null,
    checkIn: mood.enabled && !mood.today,
  });
  const summary = todaySummary(
    foodLog,
    lastWeight,
    takenMedications.map((m) => m.name),
    reached,
    undefined,
    water.enabled ? water.totalOz : 0,
    mood.enabled && mood.today ? { mood: mood.today.mood, stress: mood.today.stress } : null,
  );
  // Meals done: those with food, then those marked "nothing today".
  const mealsDone = [
    ...(summary.meals?.names ?? []).map(capitalize),
    ...skippedMeals.map((m) => `no ${m}`),
  ];
  const waterDone = summary.waterOz !== null && water.reached;
  // "Today so far" sits alongside "Left to do" as soon as anything is done, so
  // there's always somewhere to see (and undo) it — nothing waits on finishing everything.
  const anythingDone =
    mealsDone.length > 0 ||
    summary.weighedIn !== null ||
    summary.checkIn !== null ||
    takenMedications.length > 0 ||
    waterDone ||
    summary.stepGoalReached;
  // The chip holds back awards that haven't been celebrated yet, so its
  // number ticks up (and pulses) as the feathers land on it.
  const shownWaypoints = Math.max(waypoints - pendingPoints, 0);
  const replayKey = useReplayOnFocus(todaySteps);
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

  // A milestone is marked once the feathers have landed, so the total on the
  // card is the one that crossed it. Like the bursts, an award earned elsewhere
  // (logging a meal, say) waits until Today is back on screen.
  const { pending: pendingMilestone, markCelebrated } = usePendingMilestone();
  useEffect(() => {
    if (!isFocused || playing || celebrations.length || !pendingMilestone) return;
    markCelebrated(pendingMilestone);
    navigation.navigate('Reward', {
      kind: 'milestone',
      title: pendingMilestone.name,
      subtitle:
        pendingMilestone.lap > 1
          ? `Milestone reached · Migration ${pendingMilestone.lap}`
          : 'Milestone reached',
      footer: 'Earned for showing up — never for weight or calories.',
    });
  }, [
    isFocused,
    playing,
    celebrations.length,
    pendingMilestone,
    markCelebrated,
    navigation,
  ]);

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
                <AnimatedNumber
                  value={shownWaypoints}
                  style={[s.chipText, { color: colors.violet }]}
                />
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
          <LinearGradient colors={skyFor(progress) as [string, string, ...string[]]} style={s.hero}>
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

            <CountUp
              target={todaySteps}
              replayKey={replayKey}
              style={s.stepBig}
            />
            {stepsStatus !== 'connected' ? (
              <Pressable
                onPress={() => navigation.navigate('Settings', { screen: 'HealthData' })}
                hitSlop={8}
                accessibilityRole='button'
              >
                <Text style={s.stepSub}>
                  Connect steps to start a streak ›
                </Text>
              </Pressable>
            ) : (
              <Text style={s.stepSub}>
                {reached
                  ? `Goal reached · ${settings.stepGoal.toLocaleString()} steps`
                  : `${remaining.toLocaleString()} to go`}
              </Text>
            )}
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
        <Text style={s.caption}>{factForDay(todayKey)}</Text>
        {/* Once the goal is reached today is a goal day, so there's no rest day to take or undo. */}
        {reached ? null : todayIsRest ? (
          <Pressable onPress={undoRestDay} hitSlop={8}>
            <Text style={s.restLink}>Undo today's rest day</Text>
          </Pressable>
        ) : restLeft > 0 ? (
          <Pressable onPress={takeRestDay} hitSlop={8}>
            <Text style={s.restLink}>
              Take today as a rest day · {restLeft} left this week
            </Text>
          </Pressable>
        ) : stepsStatus === 'connected' ? (
          <Text style={[s.restLink, s.restNote]}>
            This week's rest days are used · more on Monday
          </Text>
        ) : null}

        {openItems.length ? (
          <>
            <GroupLabel>Left to do</GroupLabel>
            <Group>
              {openItems.map((item) =>
                item.kind === 'water' ? (
                  <Row
                    key='water'
                    title='Water'
                    sub={`${formatVolume(item.totalOz)} of ${formatVolume(item.goalOz)}`}
                    icon={
                      <IconBadge bg={colors.waterTint}>
                        <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                          <Path
                            d='M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z'
                            stroke={colors.water}
                            strokeWidth={2}
                          />
                        </Svg>
                      </IconBadge>
                    }
                    right={
                      // Only the button logs a drink, so a stray tap on the row can't.
                      <Pressable
                        onPress={() => water.addWater(quickWaterOz[0])}
                        hitSlop={8}
                        style={s.addBtn}
                        accessibilityRole='button'
                        accessibilityLabel={`Add ${formatVolume(quickWaterOz[0])} of water`}
                      >
                        <Text style={s.markText}>{`+${formatVolume(quickWaterOz[0])}`}</Text>
                      </Pressable>
                    }
                  />
                ) : item.kind === 'checkIn' ? (
                  <Row
                    key='check-in'
                    title='Check in'
                    sub='How are your mood and stress today?'
                    onPress={() => navigation.navigate('CheckIn')}
                    icon={
                      <IconBadge bg={colors.violetTint}>
                        <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                          <Path
                            d='M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14.5s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01'
                            stroke={colors.violet}
                            strokeWidth={2}
                          />
                        </Svg>
                      </IconBadge>
                    }
                    chevron
                  />
                ) : item.kind === 'medication' ? (
                  <Row
                    key={`med-${item.medicationId}`}
                    title={`Take ${item.name}`}
                    sub={`Due ${formatMinutes(item.at)}`}
                    onPress={() => setTaken(item.medicationId, true)}
                    icon={
                      <IconBadge bg={colors.violetTint}>
                        <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                          <Path
                            d='M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7zM8.5 8.5l7 7'
                            stroke={colors.violet}
                            strokeWidth={2}
                          />
                        </Svg>
                      </IconBadge>
                    }
                    right={<Text style={s.markText}>Mark taken</Text>}
                  />
                ) : item.kind === 'meal' ? (
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
        ) : null}
        {anythingDone ? (
          <>
            <GroupLabel>Today so far</GroupLabel>
            <Group>
              {mealsDone.length ? (
                <Row
                  key='done-meals'
                  title='Meals logged'
                  sub={
                    mealsDone.join(', ') +
                    (showCalories && summary.meals
                      ? ` · ${summary.meals.calories.toLocaleString()} cal`
                      : '')
                  }
                  icon={<DoneBadge />}
                />
              ) : null}
              {summary.weighedIn ? (
                <Row
                  key='done-weight'
                  title='Weighed in'
                  sub={`${formatWeight(summary.weighedIn.lb)}, ${formatLoggedAt(summary.weighedIn.loggedAt)}`}
                  icon={<DoneBadge />}
                />
              ) : null}
              {summary.checkIn ? (
                <Row
                  key='done-check-in'
                  title='Checked in'
                  sub={`Mood ${summary.checkIn.mood} · ${scoreWord('mood', summary.checkIn.mood)} · Stress ${summary.checkIn.stress} · ${scoreWord('stress', summary.checkIn.stress)}`}
                  icon={<DoneBadge />}
                  right={
                    <Pressable onPress={() => navigation.navigate('CheckIn')} hitSlop={8}>
                      <Text style={s.markText}>Edit</Text>
                    </Pressable>
                  }
                />
              ) : null}
              {takenMedications.map((m) => (
                <Row
                  key={`done-med-${m.id}`}
                  title={`Took ${m.name}`}
                  icon={<DoneBadge />}
                  right={
                    <Pressable onPress={() => setTaken(m.id, false)} hitSlop={8}>
                      <Text style={s.markText}>Undo</Text>
                    </Pressable>
                  }
                />
              ))}
              {waterDone && summary.waterOz !== null ? (
                <Row
                  key='done-water'
                  title='Water'
                  sub={`${formatVolume(summary.waterOz)} of ${formatVolume(water.goalOz)}`}
                  icon={<DoneBadge />}
                />
              ) : null}
              {summary.stepGoalReached ? (
                <Row
                  key='done-steps'
                  title='Step goal reached'
                  sub={`${todaySteps.toLocaleString()} steps`}
                  icon={<DoneBadge />}
                />
              ) : null}
            </Group>
          </>
        ) : null}

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

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** A small green tick for the things already done today. */
function DoneBadge() {
  return (
    <IconBadge bg={colors.kelpTint}>
      <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
        <Path
          d='M5 12.5l4.5 4.5L19 7.5'
          stroke={colors.kelp}
          strokeWidth={2.4}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </Svg>
    </IconBadge>
  );
}

const s = StyleSheet.create({
  restLink: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.driftwood,
    textAlign: 'center',
    marginTop: space.sm,
  },
  restNote: { fontFamily: font.body, color: colors.ink3 },
  markText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
  addBtn: {
    backgroundColor: colors.coralTint,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.md,
  },
});
