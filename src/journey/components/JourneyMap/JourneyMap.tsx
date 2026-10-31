import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { colors, radius, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { AnimatedPath } from '@shared/components/FlightPath';
import { FadeIn } from '@shared/components/FadeIn/FadeIn';
import { TERN_PATH } from '@shared/components/TernMark';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { useSettings } from '@/domain/settings/SettingsContext';
import { JourneyView } from '@/domain/settings/models/journeyView';
import { Milestones } from '@/domain/waypoints/models/milestone';
import { JourneyMapShapes } from './models/journeyMapShapes';
import {
  nearestStop,
  pointAt,
  routeIndex,
  routePath,
  routePointCount,
  stopIndex,
} from './utils/routeAt';

/** Timings and sizes for the map's tern, labels and toggle. */
class MapLayout {
  static readonly FLIGHT_MS = 1800;
  /** The tern's position updates at most this often (about 30 per second). */
  static readonly BIRD_UPDATE_MS = 33;
  /** The tern mark's 2000-unit drawing, scaled to about 22 points across. */
  static readonly BIRD_SCALE = 0.011;
  static readonly LABEL_W = 180;
  /** How long a tapped stop's name stays up, from the latest tap. */
  static readonly LABEL_MS = 2500;
}

const SHAPES = {
  [JourneyView.Map]: JourneyMapShapes.MAP,
  [JourneyView.Globe]: JourneyMapShapes.GLOBE,
};

/**
 * The migration on a real map of the Atlantic: coastlines, the route through every stop, and
 * the tern flying it from the colony to where it is now. Stops already passed are filled, the
 * next is gold, and a finished migration stays faintly underneath the current one. Tapping
 * names the nearest stop. A toggle switches between a flat map and a globe, and is remembered.
 */
export function JourneyMap({
  progress,
  lap,
  replayKey = 0,
}: {
  /** How far through the current migration, 0 to 1. */
  progress: number;
  /** Which migration this is: 1 for the first. */
  lap: number;
  replayKey?: number;
}) {
  const { settings, updateSettings } = useSettings();
  const view = settings.journeyView;
  const shape = SHAPES[view];
  const still = useReduceMotion();
  const target = routeIndex(progress);
  const last = routePointCount(shape) - 1;
  const path = useMemo(() => routePath(shape), [shape]);

  const travel = useRef(new Animated.Value(still ? target : 0)).current;
  const [birdIndex, setBirdIndex] = useState(still ? target : 0);
  const [width, setWidth] = useState(0);
  // `tap` counts taps, so tapping the same stop again keeps its name up for longer.
  const [tapped, setTapped] = useState<{ stop: number; tap: number } | null>(
    null,
  );

  const next = Milestones.STOPS.findIndex(
    (s) => s.waypoints > progress * Milestones.MIGRATION_LENGTH,
  );

  useEffect(() => {
    // With Reduce Motion on the tern sits where it belongs, with no flight.
    if (still) {
      travel.setValue(target);
      setBirdIndex(target);
      return;
    }
    let lastAt = 0;
    const id = travel.addListener(({ value }) => {
      // Each update re-renders the map, so not on every animation frame.
      const now = Date.now();
      if (now - lastAt < MapLayout.BIRD_UPDATE_MS) return;
      lastAt = now;
      setBirdIndex(value);
    });
    travel.setValue(0);
    Animated.timing(travel, {
      toValue: target,
      duration: MapLayout.FLIGHT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      // Land exactly on the spot (the last throttled frame may be a touch short).
      if (finished) setBirdIndex(target);
    });
    return () => {
      travel.removeListener(id);
      travel.stopAnimation();
    };
  }, [target, replayKey, still, travel]);

  useEffect(() => {
    if (tapped === null) return;
    const t = setTimeout(() => setTapped(null), MapLayout.LABEL_MS);
    return () => clearTimeout(t);
  }, [tapped]);

  // The drawing fills the width and keeps its proportions, so one scale maps between them.
  const scale = width ? width / JourneyMapShapes.WIDTH : 1;
  const total = shape.lengths[last];
  const dash = travel.interpolate({
    inputRange: shape.lengths.map((_, i) => i),
    outputRange: shape.lengths.map((l) => total - l),
    extrapolate: 'clamp',
  });

  const bird = pointAt(shape, birdIndex);
  const onPress = (e: GestureResponderEvent) => {
    const stop = nearestStop(
      shape,
      e.nativeEvent.locationX / scale,
      e.nativeEvent.locationY / scale,
    );
    setTapped((was) => ({ stop, tap: (was?.tap ?? 0) + 1 }));
  };

  const shown = tapped ? pointAt(shape, stopIndex(tapped.stop)) : null;
  const label =
    tapped && shown
      ? {
          text:
            tapped.stop === next
              ? `Next: ${Milestones.STOPS[tapped.stop].name}`
              : Milestones.STOPS[tapped.stop].name,
          left: Math.min(
            Math.max(shown.x * scale - MapLayout.LABEL_W / 2, 0),
            Math.max(width - MapLayout.LABEL_W, 0),
          ),
          // Below the stop when it's too near the top to fit above.
          top:
            shown.y * scale < 30 ? shown.y * scale + 10 : shown.y * scale - 26,
        }
      : null;

  const toggle = (to: JourneyView) => {
    if (to !== view) updateSettings({ journeyView: to });
  };

  return (
    <View
      // Each view keeps its own proportions: the flat map is shorter than the globe.
      style={[s.frame, { aspectRatio: JourneyMapShapes.WIDTH / shape.height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        accessibilityRole='button'
        accessibilityLabel={
          next >= 0
            ? `Map of the migration. Heading to ${Milestones.STOPS[next].name}`
            : 'Map of the migration'
        }
        accessibilityHint='Shows the name of the stop you tap'
      >
        <Svg
          width='100%'
          height='100%'
          viewBox={`0 0 ${JourneyMapShapes.WIDTH} ${shape.height}`}
        >
          {shape.sphere ? (
            <Path
              d={shape.sphere}
              fill={colors.mapSea}
              stroke={colors.mapGrid}
              strokeWidth={1}
            />
          ) : null}
          <Path
            d={shape.graticule}
            fill='none'
            stroke={colors.mapGrid}
            strokeWidth={0.6}
          />
          <Path d={shape.land} fill={colors.mapLand} />

          {/* A finished migration stays underneath; the first one shows the way ahead dashed. */}
          {lap > 1 ? (
            <Path
              d={path}
              fill='none'
              stroke={colors.routePast}
              strokeWidth={1.6}
            />
          ) : (
            <Path
              d={path}
              fill='none'
              stroke={colors.routeAhead}
              strokeWidth={1.2}
              strokeDasharray='3 4'
            />
          )}
          <AnimatedPath
            d={path}
            fill='none'
            stroke={colors.route}
            strokeWidth={2.2}
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeDasharray={total}
            strokeDashoffset={dash as unknown as number}
          />

          {Milestones.STOPS.map((stop, i) => {
            const p = pointAt(shape, stopIndex(i));
            const reached = i < next || next < 0;
            return i === next ? (
              <Circle key={stop.id} cx={p.x} cy={p.y} r={4} fill={colors.sun} />
            ) : reached ? (
              <Circle
                key={stop.id}
                cx={p.x}
                cy={p.y}
                r={2.6}
                fill={colors.route}
              />
            ) : (
              <Circle
                key={stop.id}
                cx={p.x}
                cy={p.y}
                r={2.6}
                fill='none'
                stroke={colors.routeAhead}
                strokeWidth={1.2}
              />
            );
          })}

          {/* The tern faces right in its drawing, so it turns to the way it's flying. */}
          <G
            transform={`translate(${bird.x - 1000 * MapLayout.BIRD_SCALE}, ${bird.y - 1000 * MapLayout.BIRD_SCALE}) scale(${MapLayout.BIRD_SCALE}) rotate(${bird.angle} 1000 1000)`}
          >
            <Path d={TERN_PATH} fill={colors.onDark} />
          </G>
        </Svg>
      </Pressable>

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

      <View style={s.toggle}>
        {[
          {
            to: JourneyView.Map,
            icon: 'map-outline' as const,
            name: 'Flat map',
          },
          { to: JourneyView.Globe, icon: 'earth' as const, name: 'Globe' },
        ].map(({ to, icon, name }) => (
          <Pressable
            key={to}
            onPress={() => toggle(to)}
            hitSlop={6}
            style={[s.toggleButton, view === to && s.toggleOn]}
            accessibilityRole='button'
            accessibilityLabel={name}
            accessibilityState={{ selected: view === to }}
          >
            <Icon
              name={icon}
              size={15}
              color={view === to ? colors.onDark : colors.routeAhead}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { width: '100%' },
  label: {
    position: 'absolute',
    width: MapLayout.LABEL_W,
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
  toggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.chipOnDark,
    borderRadius: radius.pill,
    padding: 2,
  },
  toggleButton: {
    width: 28,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.mapLand },
});
