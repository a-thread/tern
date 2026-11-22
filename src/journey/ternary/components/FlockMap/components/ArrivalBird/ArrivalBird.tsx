import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { FlockLooks } from '@/journey/models/flockLooks';

class ArrivalTimes {
  static readonly GLIDE = 1400;
  static readonly SETTLE = 600;
  static readonly BIRD = 44;
  /** Where it settles, as fractions of the map: beside the shared bird. */
  static readonly AT = { x: 0.42, y: 0.38 };
  /** How high its path arcs on the way in, in points. */
  static readonly ARC = 28;
}

/**
 * Once, right after you join or start a ternary: your bird glides in from the edge of the map,
 * settles beside the shared bird, then fades as the flock takes over. With Reduce Motion it
 * isn't drawn; either way the phone gives a little "done" tap.
 */
export function ArrivalBird({
  look,
  onDone,
}: {
  look: number;
  onDone: () => void;
}) {
  const still = useReduceMotion();
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  const t = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const land = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    };
    if (still) {
      land();
      onDone();
      return;
    }
    if (!room) return;
    const flight = Animated.sequence([
      Animated.timing(t, {
        toValue: 1,
        duration: ArrivalTimes.GLIDE,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: ArrivalTimes.SETTLE,
        delay: 300,
        useNativeDriver: true,
      }),
    ]);
    const landing = setTimeout(land, ArrivalTimes.GLIDE);
    flight.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => {
      clearTimeout(landing);
      flight.stop();
    };
    // onDone changes each render; the flight runs once, when there's room for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, room, t, fade]);

  if (still) return null;
  const toX = room ? room.w * ArrivalTimes.AT.x - ArrivalTimes.BIRD / 2 : 0;
  const toY = room ? room.h * ArrivalTimes.AT.y - ArrivalTimes.BIRD / 2 : 0;
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents='none'
      importantForAccessibility='no-hide-descendants'
      accessibilityElementsHidden
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!room) setRoom({ w: width, h: height });
      }}
    >
      {room ? (
        <Animated.Image
          source={FlockLooks.source(look)}
          accessibilityIgnoresInvertColors
          style={[
            s.bird,
            {
              opacity: fade,
              transform: [
                {
                  translateX: t.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-ArrivalTimes.BIRD, toX],
                  }),
                },
                {
                  translateY: t.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [toY + 12, toY - ArrivalTimes.ARC, toY],
                  }),
                },
                {
                  scale: t.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  bird: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ArrivalTimes.BIRD,
    height: ArrivalTimes.BIRD,
  },
});
