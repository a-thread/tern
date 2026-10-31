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
import Svg, { Circle, G, Image as SvgImage } from 'react-native-svg';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { AnimatedPath } from '@shared/components/FlightPath';
import { FadeIn } from '@shared/components/FadeIn/FadeIn';
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
import { ternPose } from './utils/ternPose';
import { toFrame, toMap } from './utils/mapZoom';
import { legZoom } from './utils/legZoom';
import { useMapZoom } from './hooks/useMapZoom';
import { MapBase } from './components/MapBase/MapBase';

/** Timings and sizes for the map's tern, labels and toggle. */
class MapLayout {
  static readonly FLIGHT_MS = 1800;
  /** The tern's position updates at most this often (about 30 per second). */
  static readonly BIRD_UPDATE_MS = 33;
  /**
   * The tern image's width on the map, in the drawing's units (about points). Its wings run
   * corner to corner, so the wingspan comes out at about twice this.
   */
  static readonly BIRD_W = 20;
  static readonly LABEL_W = 180;
  /** How far above or below the stop its name sits. */
  static readonly LABEL_ABOVE = 26;
  static readonly LABEL_BELOW = 10;
  /** The corner the zoom and view buttons take up, from the top-right: a name stays out of it. */
  static readonly CONTROLS_W = 128;
  static readonly CONTROLS_H = 48;
  /** How long a tapped stop's name stays up, from the latest tap. */
  static readonly LABEL_MS = 2500;
  /** Two taps this close together in time (ms) and space (points) make a double tap. */
  static readonly DOUBLE_TAP_MS = 300;
  static readonly DOUBLE_TAP_SLOP = 30;
}

/** The tern seen from above, cropped from design/flying-bird-icon.png. */
class TernIcon {
  static readonly SOURCE = require('../../../../assets/journey-tern.png');
  /** Height over width of the image. */
  static readonly RATIO = 119 / 72;
  /** Where its body sits in the image, as shares of the width and height: it turns about here. */
  static readonly ANCHOR = { x: 0.611, y: 0.464 };
  /** The way it's drawn heading, in degrees clockwise from east: right and a little down. */
  static readonly HEADING = 15;
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
 * It opens close up on the leg the tern is flying. Double-tap (or the button beside the toggle)
 * to zoom out to the whole route, and again to come back. Pinch to zoom anywhere in between,
 * and drag to look around while zoomed.
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
  const frameHeight = width * (shape.height / JourneyMapShapes.WIDTH);
  // It opens close up on the leg the tern is flying, like the old route strip.
  const home = legZoom(shape, progress, width, frameHeight);
  const {
    zoom,
    tapPoint,
    moving,
    zoomBy,
    whole,
    toggleWhole,
    frameProps,
    moveStyle,
  } = useMapZoom({
    width,
    height: frameHeight,
    home,
    resetKey: view,
    onGestureStart: () => setTapped(null),
  });
  // Dots, lines and the tern keep their size as the map zooms, so they're drawn this much smaller.
  const k = zoom.scale;
  const lastTap = useRef<{ at: number; x: number; y: number } | null>(null);
  const total = shape.lengths[last];
  // Built once per view: the tern's flight re-renders the map about 30 times a second.
  const dash = useMemo(
    () =>
      travel.interpolate({
        inputRange: shape.lengths.map((_, i) => i),
        outputRange: shape.lengths.map((l) => total - l),
        extrapolate: 'clamp',
      }),
    [travel, shape, total],
  );

  const bird = ternPose(shape, birdIndex, TernIcon.HEADING);
  const birdW = MapLayout.BIRD_W / k;
  const birdH = birdW * TernIcon.RATIO;

  // What a held single tap reads when it goes off: the map as it is then, not as it was tapped.
  const current = useRef({ zoom, shape, scale });
  current.current = { zoom, shape, scale };
  const heldTap = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (heldTap.current) clearTimeout(heldTap.current);
    },
    [],
  );

  const onPress = (e: GestureResponderEvent) => {
    const at = tapPoint(e);
    const now = Date.now();
    const prev = lastTap.current;
    lastTap.current = { at: now, ...at };
    if (heldTap.current) clearTimeout(heldTap.current);
    heldTap.current = null;
    // A second tap close by, soon after, zooms out to the whole route, or back in to the leg.
    if (
      prev &&
      now - prev.at < MapLayout.DOUBLE_TAP_MS &&
      Math.hypot(at.x - prev.x, at.y - prev.y) < MapLayout.DOUBLE_TAP_SLOP
    ) {
      lastTap.current = null;
      setTapped(null);
      toggleWhole();
      return;
    }
    // A single tap names the nearest stop, but only once no second tap has come, so a double
    // tap doesn't flash a name first. Not while the map is moving: what's on screen then isn't
    // drawn where the tap would be placed.
    heldTap.current = setTimeout(() => {
      heldTap.current = null;
      if (moving()) return;
      const map = current.current;
      const spot = toMap(map.zoom, at);
      const stop = nearestStop(
        map.shape,
        spot.x / map.scale,
        spot.y / map.scale,
      );
      setTapped((was) => ({ stop, tap: (was?.tap ?? 0) + 1 }));
    }, MapLayout.DOUBLE_TAP_MS);
  };

  // Where the tapped stop shows in the frame, zoomed or not; no label for one zoomed out of view.
  const shown = tapped
    ? toFrame(zoom, {
        x: pointAt(shape, stopIndex(tapped.stop)).x * scale,
        y: pointAt(shape, stopIndex(tapped.stop)).y * scale,
      })
    : null;
  const labelLeft = shown
    ? Math.min(
        Math.max(shown.x - MapLayout.LABEL_W / 2, 0),
        Math.max(width - MapLayout.LABEL_W, 0),
      )
    : 0;
  // Above the stop, unless that's off the top or under the buttons in the corner.
  const above = shown ? shown.y - MapLayout.LABEL_ABOVE : 0;
  const underButtons =
    above < MapLayout.CONTROLS_H &&
    labelLeft + MapLayout.LABEL_W > width - MapLayout.CONTROLS_W;
  const label =
    tapped &&
    shown &&
    shown.x >= 0 &&
    shown.x <= width &&
    shown.y >= 0 &&
    shown.y <= frameHeight
      ? {
          text:
            tapped.stop === next
              ? `Next: ${Milestones.STOPS[tapped.stop].name}`
              : Milestones.STOPS[tapped.stop].name,
          left: labelLeft,
          top:
            above < 4 || underButtons ? shown.y + MapLayout.LABEL_BELOW : above,
        }
      : null;

  // For screen readers, which can't pinch: zoom in and out a step about the middle.
  const middle = { x: width / 2, y: frameHeight / 2 };
  const onAccessibilityAction = (name: string) => {
    if (name === 'zoomIn') zoomBy(1.5, middle);
    if (name === 'zoomOut') zoomBy(1 / 1.5, middle);
  };

  const toggle = (to: JourneyView) => {
    if (to !== view) updateSettings({ journeyView: to });
  };

  return (
    <View
      {...frameProps}
      // Each view keeps its own proportions: the flat map is shorter than the globe.
      style={[s.frame, { aspectRatio: JourneyMapShapes.WIDTH / shape.height }]}
      testID='journey-map'
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        frameProps.onLayout();
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, moveStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onPress}
          accessibilityRole='button'
          accessibilityLabel={
            next >= 0
              ? `Map of the migration. Heading to ${Milestones.STOPS[next].name}`
              : 'Map of the migration'
          }
          accessibilityHint='Shows the name of the nearest stop. Use the Zoom in and Zoom out actions to zoom.'
          accessibilityActions={[
            { name: 'zoomIn', label: 'Zoom in' },
            { name: 'zoomOut', label: 'Zoom out' },
          ]}
          onAccessibilityAction={(e) =>
            onAccessibilityAction(e.nativeEvent.actionName)
          }
        >
          <Svg
            width='100%'
            height='100%'
            viewBox={`0 0 ${JourneyMapShapes.WIDTH} ${shape.height}`}
          >
            {/* The zoom and turn, drawn as part of the map so it stays sharp close up. */}
            <G
              transform={`translate(${zoom.x / scale}, ${zoom.y / scale}) rotate(${zoom.rotate}) scale(${zoom.scale})`}
            >
              <MapBase shape={shape} path={path} lap={lap} k={k} />
              <AnimatedPath
                d={path}
                fill='none'
                stroke={colors.route}
                strokeWidth={2.2 / k}
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeDasharray={total}
                strokeDashoffset={dash as unknown as number}
              />

              {Milestones.STOPS.map((stop, i) => {
                const p = pointAt(shape, stopIndex(i));
                const reached = i < next || next < 0;
                return i === next ? (
                  <Circle
                    key={stop.id}
                    cx={p.x}
                    cy={p.y}
                    r={4 / k}
                    fill={colors.sun}
                  />
                ) : reached ? (
                  <Circle
                    key={stop.id}
                    cx={p.x}
                    cy={p.y}
                    r={2.6 / k}
                    fill={colors.route}
                  />
                ) : (
                  <Circle
                    key={stop.id}
                    cx={p.x}
                    cy={p.y}
                    r={2.6 / k}
                    fill='none'
                    stroke={colors.routeAhead}
                    strokeWidth={1.2 / k}
                  />
                );
              })}

              {/* Seen from above, so it can turn about its body to face any way it flies. */}
              <G
                transform={`translate(${bird.x}, ${bird.y}) rotate(${bird.rotate})`}
              >
                <SvgImage
                  href={TernIcon.SOURCE}
                  x={-TernIcon.ANCHOR.x * birdW}
                  y={-TernIcon.ANCHOR.y * birdH}
                  width={birdW}
                  height={birdH}
                />
              </G>
            </G>
          </Svg>
        </Pressable>
      </Animated.View>

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

      <View style={s.controls}>
        {/* The same as a double tap: out to the whole route, or back in to the leg. */}
        <Pressable
          onPress={toggleWhole}
          hitSlop={6}
          style={[s.pill, s.pillButton]}
          accessibilityRole='button'
          accessibilityLabel={
            whole ? 'Zoom to the tern' : 'Show the whole route'
          }
        >
          <Icon
            name={whole ? 'crosshairs-gps' : 'arrow-expand'}
            size={14}
            color={colors.onDark}
          />
        </Pressable>
        <View style={[s.pill, s.toggle]}>
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
    </View>
  );
}

const s = StyleSheet.create({
  // Zoomed in, the map stays inside its frame, rounded like the app's other cards.
  frame: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
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
  controls: {
    position: 'absolute',
    top: space.lg,
    right: space.lg,
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: colors.chipOnDark,
    borderRadius: radius.pill,
  },
  pillButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: { flexDirection: 'row', padding: 2 },
  toggleButton: {
    width: 28,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.mapLand },
});
