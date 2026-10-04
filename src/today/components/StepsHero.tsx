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
  const { todaySteps, streak, status } = useActivity();
  const greeting = greetingFor();
  const progress = todaySteps / settings.stepGoal;
  const remaining = Math.max(settings.stepGoal - todaySteps, 0);
  const reached = progress >= 1;

  return (
    <View ref={heroRef} collapsable={false}>
      <LinearGradient colors={skyFor(progress) as [string, string, ...string[]]} style={s.hero}>
        <View style={s.top}>
          <Text style={s.greeting}>
            {settings.firstName ? `${greeting}, ${settings.firstName}` : greeting}
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

        <CountUp target={todaySteps} replayKey={replayKey} style={s.stepBig} />
        {status !== StepsStatus.Connected ? (
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
  stepSub: { fontFamily: font.body, fontSize: 11.5, color: '#DCD4DE', textAlign: 'center' },
});
