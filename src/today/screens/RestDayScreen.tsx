import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '@shared/theme';
import type { RootStackParamList } from '@shared/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RestDay'>;

/**
 * The rest-day explanation. Loafing days hold the streak, don't break it,
 * and earn waypoints — this card is where that gets said explicitly, in
 * place, rather than assumed.
 */
export default function RestDayScreen({ navigation, route }: Props) {
  const { dayName, steps, waypoints } = route.params;

  return (
    <Pressable style={s.overlay} onPress={() => navigation.goBack()}>
      <Pressable style={s.card} onPress={() => {}}>
        <Pressable
          style={s.close}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Text style={s.closeText}>✕</Text>
        </Pressable>

        <View style={s.head}>
          <View style={s.iconBadge}>
            <Svg
              width={17}
              height={17}
              viewBox='0 0 24 24'
              fill='none'
              stroke={colors.driftwood}
              strokeWidth={2}
            >
              <Path d='M4 18h16M6 18v-3a6 6 0 0 1 12 0v3' />
            </Svg>
          </View>
          <View>
            <Text style={s.title}>Rest day</Text>
            <Text style={s.sub}>
              {steps.toLocaleString()} steps · +{waypoints} waypoints
            </Text>
          </View>
        </View>

        <Text style={s.body}>
          Terns spend hours resting between flights — digesting, preening,
          waiting out weather. It's a documented part of migration, not a gap in
          it. Your streak carries through.
        </Text>

        <Text style={s.dayName}>{dayName}</Text>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,15,10,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.driftwoodTint,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  close: { position: 'absolute', top: 10, right: 12, padding: 4 },
  closeText: { color: colors.driftwood, fontSize: 14, opacity: 0.6 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  sub: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    marginTop: 1,
  },
  body: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
  },
  dayName: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.driftwood,
    marginTop: 12,
    opacity: 0.7,
  },
});
