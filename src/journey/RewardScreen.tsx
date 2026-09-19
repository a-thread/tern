import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { font } from '@shared/theme';
import TernMark from '@shared/components/TernMark';
import { useAnimatedNumber } from '@shared/hooks/useAnimatedNumber';
import type { RootStackParamList } from '@shared/navigation/types';
import { useWaypoints } from './WaypointsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Reward'>;

const GRADIENTS: Record<
  Props['route']['params']['kind'],
  readonly [string, string, string]
> = {
  goal: ['#1A2630', '#3E5A6C', '#8B7C6B'],
  milestone: ['#2A2440', '#4A4372', '#4E8C7D'],
  loafing: ['#3A3327', '#5B4636', '#8A6A4F'],
};

/** Fires automatically when a goal/milestone is crossed — never for weight or calorie totals. */
export default function RewardScreen({ navigation, route }: Props) {
  const { kind, title, subtitle, points, footer } = route.params;
  const { waypoints } = useWaypoints();
  // Reactive rather than a one-shot mount animation: the award that earned this
  // screen its `points` may land just before or just after this mounts, and
  // this stays correct either way — animating the gain if it arrives late,
  // showing the settled total plainly if it already landed.
  const animatedTotal = useAnimatedNumber(waypoints, 900);

  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(markScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardScale, markScale]);

  return (
    <Pressable style={s.overlay} onPress={() => navigation.goBack()}>
      <Pressable onPress={() => {}}>
        <Animated.View
          style={{ opacity: cardOpacity, transform: [{ scale: cardScale }] }}
        >
          <LinearGradient colors={GRADIENTS[kind]} style={s.modal}>
            <Pressable
              style={s.close}
              onPress={() => navigation.goBack()}
              hitSlop={10}
            >
              <Text style={s.closeText}>✕</Text>
            </Pressable>
            <Animated.View style={{ transform: [{ scale: markScale }] }}>
              <TernMark size={76} color='#F2C888' />
            </Animated.View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.sub}>
              {subtitle}
              {'\n'}
              {points ? (
                <Text style={s.points}>+{points} waypoints</Text>
              ) : null}
              {points ? ' · ' : ''}
              {animatedTotal.toLocaleString()} total
            </Text>
            {footer ? <Text style={s.foot}>{footer}</Text> : null}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,15,10,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: { width: 280, borderRadius: 20, padding: 22, alignItems: 'center' },
  close: { position: 'absolute', top: 10, right: 12, padding: 4 },
  closeText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  title: {
    fontFamily: font.displayMedium,
    fontSize: 19,
    color: '#FBFAF7',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 7,
    lineHeight: 24,
  },
  sub: {
    fontFamily: font.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 18,
  },
  points: { fontFamily: font.bold, color: '#F2C888' },
  foot: {
    fontFamily: font.body,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 14,
    textAlign: 'center',
  },
});
