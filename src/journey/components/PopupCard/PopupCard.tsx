import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, font, typography } from '@shared/theme';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/** The card's width; the confetti and route are laid out against it. */
export const CARD_WIDTH = 280;

/**
 * The dark card the waypoint popups sit on: the screen dims, the card springs in, and a tap
 * outside (or ✕) closes it. Ends with a link to Journey and the promise that waypoints are
 * for showing up. `overlay` draws over the card (confetti), outside its rounded edge.
 */
export function PopupCard({
  colors,
  children,
  overlay,
}: {
  colors: readonly [string, string, string];
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  const navigation = useRootNavigation();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const close = () => navigation.goBack();
  const toJourney = () => navigation.navigate('Tabs', { screen: 'Journey' });

  return (
    <Pressable style={s.overlay} onPress={close}>
      <Pressable onPress={() => {}}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <LinearGradient colors={colors} style={s.card}>
            <Pressable
              style={s.close}
              onPress={close}
              hitSlop={10}
              accessibilityLabel='Close'
            >
              <Text style={s.closeText}>✕</Text>
            </Pressable>
            {children}
            <Pressable onPress={toJourney} hitSlop={8} accessibilityRole='link'>
              <Text style={s.link}>See your journey ›</Text>
            </Pressable>
          </LinearGradient>
          {overlay ? (
            <View style={StyleSheet.absoluteFill} pointerEvents='none'>
              {overlay}
            </View>
          ) : null}
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
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
  },
  close: { position: 'absolute', top: 10, right: 12, padding: 4, zIndex: 1 },
  closeText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  link: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.sunLight,
    marginTop: 16,
  },
  foot: {
    fontFamily: font.body,
    fontSize: typography.small.fontSize,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 12,
    textAlign: 'center',
  },
});

/** Text styles the popups share. */
export const popup = StyleSheet.create({
  label: {
    fontFamily: font.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  big: {
    fontFamily: font.displayMedium,
    fontSize: 30,
    color: '#FBFAF7',
    textAlign: 'center',
    marginTop: 4,
  },
  title: {
    fontFamily: font.displayMedium,
    fontSize: 21,
    color: '#FBFAF7',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  section: { alignSelf: 'stretch', marginTop: 16 },
  sectionTitle: {
    fontFamily: font.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 6,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  lineText: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.88)',
  },
  gold: { fontFamily: font.semibold, color: colors.sunLight },
  soft: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
  },
});
