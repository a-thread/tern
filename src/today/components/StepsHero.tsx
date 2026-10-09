import React, { useState } from 'react';
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
import { useDayKey } from '@shared/hooks/useDayKey';
import { useMovement } from '@movement/MovementContext';
import { entriesOn, movementSummary } from '@movement/models/movementEntry';
import { MovementSheet } from '@movement/components/MovementSheet';

/** The sky card: greeting, streak, the bird's flight toward the step goal, and today's steps. */
export function StepsHero({
  heroRef,
  replayKey,
}: {
  heroRef: React.RefObject<View | null>;
  replayKey: number;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings } = useSettings();
  const { todaySteps, streak, freezes, status } = useActivity();
  const greeting = greetingFor();
  const movement = useMovement();
  const today = useDayKey();
  const stepsProgress = todaySteps / settings.stepGoal;
  const movementGoal = movement.enabled ? settings.movementGoalMinutes : 0;
  const movedProgress = movementGoal > 0 ? movement.todayGoalMinutes / movementGoal : 0;
  // The sky and the bird follow whichever is closer to a goal day.
  const progress = Math.max(stepsProgress, movedProgress);
  const remaining = Math.max(settings.stepGoal - todaySteps, 0);
  const reached = stepsProgress >= 1;
  const movedToGoal = !reached && movedProgress >= 1;
  const [movementOpen, setMovementOpen] = useState(false);

  return (
    <View ref={heroRef} collapsable={false}>
      <LinearGradient colors={skyFor(progress) as [string, string, ...string[]]} style={s.hero}>
        <View style={s.top}>
          <Text style={s.greeting}>
            {settings.firstName ? `${greeting}, ${settings.firstName}` : greeting}
          </Text>
          <View style={s.chips}>
            {streak > 0 ? (
              <View style={s.streakChip}>
                <Text style={s.streakText}>
                  ☀ {streak} {streak === 1 ? 'day' : 'days'}
                </Text>
              </View>
            ) : null}
            {freezes > 0 ? (
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

        <CountUp target={todaySteps} replayKey={replayKey} style={s.stepBig} />
        {movedToGoal ? (
          <Text style={s.stepSub}>
            {`Goal reached · ${movementSummary(entriesOn(movement.entries, today))}`}
          </Text>
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
              ? `Goal reached · ${settings.stepGoal.toLocaleString()} steps`
              : `${remaining.toLocaleString()} to go`}
          </Text>
        )}
        {/* Movement is the other way to a goal day, so it's logged from here. */}
        {movement.enabled ? (
          <Pressable
            onPress={() => setMovementOpen(true)}
            hitSlop={8}
            style={s.moveChip}
            accessibilityRole='button'
            accessibilityLabel='Log movement'
          >
            <Text style={s.streakText}>{movement.todayMinutes > 0 ? '+ More movement' : '+ Log movement'}</Text>
          </Pressable>
        ) : null}
      </LinearGradient>
      <MovementSheet visible={movementOpen} onClose={() => setMovementOpen(false)} />
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
