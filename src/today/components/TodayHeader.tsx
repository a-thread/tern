import React from 'react';
import { Animated, Pressable, StyleSheet, type HostInstance } from 'react-native';

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

/** The chip holds back uncelebrated awards so it ticks up as the feathers land. */
export function TodayHeader({
  chipRef,
  gearRef,
}: {
  chipRef: React.RefObject<HostInstance | null>;
  /** The settings gear, for the tip about Settings. */
  gearRef?: React.RefObject<HostInstance | null>;
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
      gearRef={gearRef}
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
