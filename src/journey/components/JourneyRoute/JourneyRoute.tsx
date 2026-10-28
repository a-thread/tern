import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, typography } from '@shared/theme';
import { AnimatedPath } from '@shared/components/FlightPath';
import { FadeIn } from '@shared/components/FadeIn/FadeIn';
import { Milestones } from '@/domain/waypoints/models/milestone';
import { pointAlongRoute, RouteShape } from './utils/routePoints';

/* ------------------------------------------------------------------ */
/* Journey route                                                        */
/* ------------------------------------------------------------------ */

/** The drawing's size, and the tapped stop's name above it. */
class RouteLayout {
  static readonly VIEW_W = 280;
  static readonly VIEW_H = 46;
  static readonly LABEL_W = 170;
  /** How long a tapped stop's name stays up, from the latest tap. */
  static readonly LABEL_MS = 2500;
}

/** Every stop on one migration, placed along the path by its share of the trip. */
const STOPS = Milestones.STOPS.map((stop) => ({
  ...stop,
  fraction: stop.waypoints / Milestones.MIGRATION_LENGTH,
  at: pointAlongRoute(stop.waypoints / Milestones.MIGRATION_LENGTH),
}));

/**
 * The migration drawn as a line, with a dot for each stop: filled once passed, gold for the
 * one the bird is headed to, hollow after that. Tapping the route names the nearest stop.
 */
export function JourneyRoute({
  progress,
  replayKey = 0,
}: {
  progress: number;
  replayKey?: number;
}) {
  const dash = useRef(new Animated.Value(RouteShape.LENGTH)).current;
  const [width, setWidth] = useState(0);
  // `tap` counts taps, so tapping the same stop again keeps its name up for longer.
  const [tapped, setTapped] = useState<{ stop: number; tap: number } | null>(
    null,
  );
  const next = STOPS.findIndex((stop) => stop.fraction > progress);

  useEffect(() => {
    dash.setValue(RouteShape.LENGTH);
    Animated.timing(dash, {
      toValue: RouteShape.LENGTH * (1 - Math.min(progress, 1)),
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, replayKey, dash]);

  useEffect(() => {
    if (tapped === null) return;
    const t = setTimeout(() => setTapped(null), RouteLayout.LABEL_MS);
    return () => clearTimeout(t);
  }, [tapped]);

  // The drawing keeps its proportions and sits centred, so map between screen and viewBox.
  const scale = width ? Math.min(width / RouteLayout.VIEW_W, 1) : 1;
  const offset = (width - RouteLayout.VIEW_W * scale) / 2;

  const onPress = (e: GestureResponderEvent) => {
    // The label passes touches through, so this is always measured across the whole route.
    const x = (e.nativeEvent.locationX - offset) / scale;
    let nearest = 0;
    STOPS.forEach((stop, i) => {
      if (Math.abs(stop.at.x - x) < Math.abs(STOPS[nearest].at.x - x))
        nearest = i;
    });
    setTapped((was) => ({ stop: nearest, tap: (was?.tap ?? 0) + 1 }));
  };

  const shown = tapped ? STOPS[tapped.stop] : null;
  const label =
    tapped === null || shown === null
      ? null
      : {
          text: tapped.stop === next ? `Next: ${shown.name}` : shown.name,
          left: Math.min(
            Math.max(
              offset + shown.at.x * scale - RouteLayout.LABEL_W / 2,
              0,
            ),
            Math.max(width - RouteLayout.LABEL_W, 0),
          ),
          top: shown.at.y * scale - 24,
        };

  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole='button'
      accessibilityLabel={
        next >= 0 ? `Route. Heading to ${STOPS[next].name}` : 'Route'
      }
      accessibilityHint='Shows the name of the stop you tap'
    >
      <Svg
        width='100%'
        height={RouteLayout.VIEW_H}
        viewBox={`0 0 ${RouteLayout.VIEW_W} ${RouteLayout.VIEW_H}`}
      >
        <Path
          d={RouteShape.PATH}
          fill='none'
          stroke='rgba(255,255,255,0.2)'
          strokeWidth={2}
          strokeLinecap='round'
        />
        <AnimatedPath
          d={RouteShape.PATH}
          fill='none'
          stroke={colors.route}
          strokeWidth={2}
          strokeLinecap='round'
          strokeDasharray={RouteShape.LENGTH}
          strokeDashoffset={dash as unknown as number}
        />
        <Circle cx={6} cy={34} r={2.6} fill={colors.route} />
        {STOPS.map((stop, i) =>
          i === next ? (
            <Circle
              key={stop.id}
              cx={stop.at.x}
              cy={stop.at.y}
              r={3.6}
              fill={colors.sun}
            />
          ) : stop.fraction <= progress ? (
            <Circle
              key={stop.id}
              cx={stop.at.x}
              cy={stop.at.y}
              r={2.2}
              fill={colors.route}
            />
          ) : (
            <Circle
              key={stop.id}
              cx={stop.at.x}
              cy={stop.at.y}
              r={2.2}
              fill='none'
              stroke='rgba(255,255,255,0.5)'
              strokeWidth={1.2}
            />
          ),
        )}
      </Svg>
      {label && tapped ? (
        <View
          pointerEvents='none'
          style={[s.label, { left: label.left, top: label.top }]}
        >
          <FadeIn key={tapped.stop}>
            <Text style={s.labelText} numberOfLines={1}>
              {label.text}
            </Text>
          </FadeIn>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: {
    position: 'absolute',
    width: RouteLayout.LABEL_W,
    alignItems: 'center',
  },
  labelText: {
    ...typography.label,
    color: colors.onDark,
    backgroundColor: colors.chipOnDark,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
});
