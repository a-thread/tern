import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { Chip } from '@shared/components/ui';
import TernMark from '@shared/components/TernMark';
import { AnimatedNumber } from '@shared/components/AnimatedNumber/AnimatedNumber';
import { TabHeader } from '@shared/components/TabHeader/TabHeader';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { usePulseOnIncrease } from '@shared/hooks/useAnimatedNumber';
import { dayWord, formatLongDate } from '@shared/utils/date';
import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useRootNavigation } from '../../navigation/useAppNavigation';

/**
 * The tab header with the date and the waypoint chip beside the gear. The chip holds back awards
 * that haven't been celebrated yet, so its number ticks up (and pulses) as the feathers land on it.
 */
export function TodayHeader({
  chipRef,
}: {
  chipRef: React.RefObject<View | null>;
}) {
  const navigation = useRootNavigation();
  // Follows the week strip: a past day that was tapped is named here too, not just below.
  const { day, today } = useViewedDay();
  const { streak } = useActivity();
  const { waypoints, pendingPoints } = useWaypoints();
  const shownWaypoints = Math.max(waypoints - pendingPoints, 0);
  const pulse = usePulseOnIncrease(shownWaypoints);

  return (
    <TabHeader
      eyebrow={formatLongDate(day)}
      title={dayWord(day, today)}
      accessory={
        <Pressable
          onPress={() => navigation.navigate('Waypoints', { streak })}
          hitSlop={8}
          accessibilityRole='button'
          accessibilityLabel={`${shownWaypoints.toLocaleString()} waypoints`}
          accessibilityHint='Shows your waypoints and streak'
        >
          <Animated.View
            ref={chipRef}
            collapsable={false}
            style={{ transform: [{ scale: pulse }] }}
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
      }
    />
  );
}

const s = StyleSheet.create({
  chipText: { fontFamily: font.semibold, fontSize: 12 },
});
