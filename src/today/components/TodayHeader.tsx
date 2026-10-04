import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, space } from '@shared/theme';
import { Chip } from '@shared/components/ui';
import TernMark from '@shared/components/TernMark';
import { AnimatedNumber } from '@shared/components/AnimatedNumber';
import { useDayKey } from '@shared/hooks/useDayKey';
import { usePulseOnIncrease } from '@shared/hooks/useAnimatedNumber';
import { formatLongDate } from '@shared/utils/date';
import type { RootStackParamList } from '@shared/navigation/types';
import { useWaypoints } from '@journey/WaypointsContext';
import { useActivity } from '@today/ActivityContext';

/**
 * The date and title, the waypoint chip and the settings gear. The chip holds back awards that
 * haven't been celebrated yet, so its number ticks up (and pulses) as the feathers land on it.
 */
export function TodayHeader({ chipRef }: { chipRef: React.RefObject<View | null> }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const todayKey = useDayKey();
  const { streak } = useActivity();
  const { waypoints, pendingPoints } = useWaypoints();
  const shownWaypoints = Math.max(waypoints - pendingPoints, 0);
  const pulse = usePulseOnIncrease(shownWaypoints);

  return (
    <View style={s.header}>
      <View>
        <Text style={s.eyebrow}>{formatLongDate(todayKey)}</Text>
        <Text style={s.title}>Today</Text>
      </View>
      <View style={s.actions}>
        <Pressable
          onPress={() =>
            navigation.navigate('Reward', {
              kind: 'goal',
              title: 'Waypoints so far',
              subtitle: streak > 0 ? `${streak}-day streak` : 'Every step counts',
              footer: 'Earned for showing up — never for weight or calories.',
            })
          }
        >
          <Animated.View ref={chipRef} collapsable={false} style={{ transform: [{ scale: pulse }] }}>
            <Chip bg={colors.violetTint} color={colors.violet}>
              <TernMark size={12} color={colors.violet} />
              <AnimatedNumber value={shownWaypoints} style={[s.chipText, { color: colors.violet }]} />
            </Chip>
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8} style={s.gear}>
          <Svg width={19} height={19} viewBox='0 0 24 24' fill='none' stroke={colors.ink2} strokeWidth={2}>
            <Path d='M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' />
            <Path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
          </Svg>
        </Pressable>
      </View>
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
  title: { fontFamily: font.display, fontSize: 28, color: colors.ink, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gear: { padding: 2 },
  chipText: { fontFamily: font.semibold, fontSize: 12 },
});
