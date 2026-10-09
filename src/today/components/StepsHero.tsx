import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { font, radius, skyFor, space } from '@shared/theme';
import { FlightPath } from '@shared/components/charts/FlightPath';
import { CountUp } from '@shared/components/AnimatedNumber';
import type { RootStackParamList } from '@shared/navigation/types';
import { useSettings } from '@settings/SettingsContext';
import { useActivity } from '@today/ActivityContext';
import { greetingFor } from '@today/models/greeting';
import { StepsStatus } from '@today/data/steps.repository';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { addDays, formatLongDate } from '@shared/utils/date';
import { DayState } from '@shared/models/dayState';
import { useMovement } from '@movement/MovementContext';
import { entriesOn, movementSummary } from '@movement/models/movementEntry';

/**
 * The sky card: greeting, streak, the bird's flight toward the step goal, and the steps, for the
 * viewed day. A past day shows how far the bird got that day, and its date in place of the greeting.
 */
export function StepsHero({
  heroRef,
  replayKey,
}: {
  heroRef: React.RefObject<View | null>;
  replayKey: number;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings } = useSettings();
  const { todaySteps, streak, freezes, status, week } = useActivity();
  const greeting = greetingFor();
  const movement = useMovement();
  const { day, today, isToday, editable } = useViewedDay();
  const record = week.find((d) => d.day === day);
  const steps = isToday ? todaySteps : (record?.steps ?? 0);
  // A past day keeps the goal it had then.
  const stepGoal = isToday ? settings.stepGoal : (record?.goal ?? settings.stepGoal);
  const goalMinutes = isToday ? movement.todayGoalMinutes : (record?.minutes ?? 0);
  const stepsProgress = steps / stepGoal;
  const movementGoal = movement.enabled ? settings.movementGoalMinutes : 0;
  const movedProgress = movementGoal > 0 ? goalMinutes / movementGoal : 0;
  // The sky and the bird follow whichever is closer to a goal day.
  const progress = Math.max(stepsProgress, movedProgress);
  const remaining = Math.max(stepGoal - steps, 0);
  const movedOnDay = entriesOn(movement.entries, day);
  const title = isToday
    ? settings.firstName
      ? `${greeting}, ${settings.firstName}`
      : greeting
    : day === addDays(today, -1)
      ? 'Yesterday'
      : formatLongDate(day);
  const reached = stepsProgress >= 1;
  const movedToGoal = !reached && movedProgress >= 1;

  return (
    <View ref={heroRef} collapsable={false}>
      <LinearGradient colors={skyFor(progress) as [string, string, ...string[]]} style={s.hero}>
        <View style={s.top}>
          <Text style={s.greeting}>{title}</Text>
          <View style={s.chips}>
            {isToday && streak > 0 ? (
              <View style={s.streakChip}>
                <Text style={s.streakText}>
                  ☀ {streak} {streak === 1 ? 'day' : 'days'}
                </Text>
              </View>
            ) : null}
            {isToday && freezes > 0 ? (
              <View
                style={s.streakChip}
                accessible
                accessibilityLabel={`${freezes} streak ${freezes === 1 ? 'freeze' : 'freezes'}`}
              >
                <Text style={s.streakText}>❄ {freezes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <FlightPath progress={progress} replayKey={replayKey} />

        <CountUp target={steps} replayKey={replayKey} style={s.stepBig} />
        {movedToGoal ? (
          <Text style={s.stepSub}>{`Goal reached · ${movementSummary(movedOnDay)}`}</Text>
        ) : !isToday && record?.state === DayState.Rest ? (
          <Text style={s.stepSub}>Rest day</Text>
        ) : !isToday && record?.state === DayState.Frozen ? (
          <Text style={s.stepSub}>A streak freeze covered this day</Text>
        ) : status !== StepsStatus.Connected ? (
          <Pressable
            onPress={() => navigation.navigate('Settings', { screen: 'HealthData' })}
            hitSlop={8}
            accessibilityRole='button'
          >
            <Text style={s.stepSub}>Connect steps to start a streak ›</Text>
          </Pressable>
        ) : (
          <Text style={s.stepSub}>
            {reached
              ? `Goal reached · ${stepGoal.toLocaleString()} steps`
              : isToday
                ? `${remaining.toLocaleString()} to go`
                : `${remaining.toLocaleString()} short of ${stepGoal.toLocaleString()}`}
          </Text>
        )}
        {/* Movement is the other way to a goal day, so it's logged from here (today and yesterday). */}
        {movement.enabled && editable ? (
          <Pressable
            onPress={() => navigation.navigate('LogMovement', { day })}
            hitSlop={8}
            style={s.moveChip}
            accessibilityRole='button'
            accessibilityLabel='Log movement'
          >
            <Text style={s.streakText}>{movedOnDay.length > 0 ? '+ More movement' : '+ Log movement'}</Text>
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: space.lg, marginTop: space.xs },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  greeting: { fontFamily: font.body, fontSize: 11.5, color: '#E4DCE4' },
  chips: { flexDirection: 'row', gap: 6 },
  moveChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: space.sm,
  },
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
  // Sits over the lightest end of every sky gradient (pale blue, peach, gold), so it's dark ink, not white.
  stepSub: { fontFamily: font.medium, fontSize: 12, color: '#1F2D38', textAlign: 'center' },
});
