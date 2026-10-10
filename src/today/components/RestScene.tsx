import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useIsFocused } from '@react-navigation/native';

import { colors, font, radius, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { Driftwood, DriftwoodDefs } from '@today/components/Driftwood';
import {
  birdBox,
  poseAt,
  RestScenes,
  Sprite,
  type SceneMotion,
  type ScenePose,
} from '@today/models/restScene';

const SPRITE = require('../../../assets/tern-landing.png');

const W = 260;
const H = 132;
const HORIZON = RestScenes.HORIZON;
/** The light of the stars and the ripples: part of the scene's art, not the app's palette. */
const PAPER = '#FBFAF7';
const STARS = [
  { x: 30, y: 16, r: 1.2 },
  { x: 120, y: 12, r: 1 },
  { x: 215, y: 22, r: 1.3 },
  { x: 170, y: 34, r: 0.9 },
];
const SHIMMER = [
  { x1: 56, x2: 84, y: 90 },
  { x1: 60, x2: 80, y: 98 },
  { x1: 64, x2: 76, y: 106 },
];
const RIPPLES = [
  { x1: 150, x2: 200, y: 96 },
  { x1: 110, x2: 170, y: 110 },
  { x1: 190, x2: 236, y: 118 },
];

/**
 * Milliseconds between redraws: smooth in flight, slow while resting, when only the water, sun
 * and breathing drift and every redraw re-renders the whole scene.
 */
const FLIGHT_FRAME_MS = 33;
const REST_FRAME_MS = 100;

interface RestSceneProps {
  /** Where the waypoint feathers start from when resting earns its waypoints. */
  heroRef?: React.RefObject<View | null>;
  /** True when the rest day has just been taken: the tern flies in and lands. */
  entrance: boolean;
  /** True once the rest day is undone: the tern takes off, then `onLeft` is called. */
  leaving: boolean;
  onLeft: () => void;
  /** Called when the tern's feet touch the log after flying in (or at once if it never flew). */
  onTouchdown?: () => void;
  title: string;
  line: string;
  detail: string;
  note?: string;
}

/**
 * The tern, from the landing sheet: one of its 18 frames shown through a window over the scene.
 * `unit` is screen pixels per scene unit. `birdBox` places the window so the feet land where
 * the pose says, whichever way it is turned.
 */
function SpriteBird({ bird, unit }: { bird: ScenePose['bird']; unit: number }) {
  const box = birdBox(bird, unit);
  return (
    <View
      pointerEvents='none'
      style={[
        styles.birdFrame,
        {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          transform: [
            { rotate: `${bird.pitch}deg` },
            { scaleX: bird.facing },
            { scaleY: bird.breath },
          ],
        },
      ]}
    >
      <Image
        source={SPRITE}
        resizeMode='stretch'
        fadeDuration={0}
        style={{
          position: 'absolute',
          top: 0,
          left: -bird.frame * box.width,
          width: box.width * Sprite.FRAMES,
          height: box.height,
        }}
      />
    </View>
  );
}

export function RestScene({
  heroRef,
  entrance,
  leaving,
  onLeft,
  onTouchdown,
  title,
  line,
  detail,
  note,
}: RestSceneProps) {
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const { width: windowWidth } = useWindowDimensions();

  // The scene fills the card, whatever its width. Until it has been measured, estimate it from
  // the screen: Today's side padding, then the card's own.
  const [measured, setMeasured] = useState(0);
  const unit = (measured || windowWidth - 2 * (space.lg + space.md)) / W;

  // Flying in, then (the flight over) resting; the tern only flies with motion on.
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (!entrance) setLanded(false);
  }, [entrance]);
  const motion: SceneMotion = leaving
    ? 'leaving'
    : entrance && !landed && !reduceMotion
      ? 'arriving'
      : 'settled';

  const [now, setNow] = useState(() => Date.now());
  const globalStartRef = useRef(now);
  const leftRef = useRef(false);

  // Each new motion counts its time from the moment it begins. Noticed while rendering (React's
  // way of adjusting state to a change in what it reads), with the clock brought up to the same
  // instant so a motion never starts at a negative time.
  const [motionState, setMotionState] = useState({ motion, startedAt: now });
  if (motionState.motion !== motion) {
    const t = Date.now();
    setMotionState({ motion, startedAt: t });
    setNow(t);
  }

  // A steady clock, only while the screen is showing and motion is allowed.
  useEffect(() => {
    if (!isFocused || reduceMotion) return;
    const gap = motion === 'settled' ? REST_FRAME_MS : FLIGHT_FRAME_MS;
    let last = 0;
    let frame = requestAnimationFrame(function tick() {
      const t = Date.now();
      if (t - last >= gap) {
        last = t;
        setNow(t);
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isFocused, reduceMotion, motion]);

  const sinceMs = Math.max(now - motionState.startedAt, 0);

  // The landing is over, or the take-off is.
  useEffect(() => {
    if (motion === 'arriving' && sinceMs >= RestScenes.FLIGHT_MS) setLanded(true);
  }, [motion, sinceMs]);

  // The feet touch: whatever waits for the landing (the waypoint feathers) can go.
  const touchdownRef = useRef(onTouchdown);
  touchdownRef.current = onTouchdown;
  useEffect(() => {
    if (!entrance) return;
    const touched =
      motion === 'settled' ||
      (motion === 'arriving' && sinceMs >= RestScenes.FLIGHT_MS * RestScenes.TOUCHDOWN_K);
    if (touched) touchdownRef.current?.();
  }, [entrance, motion, sinceMs]);
  useEffect(() => {
    if (!leaving) {
      leftRef.current = false;
      return;
    }
    const over = reduceMotion || sinceMs >= RestScenes.FLIGHT_MS;
    if (over && !leftRef.current) {
      leftRef.current = true;
      onLeft();
    }
  }, [leaving, reduceMotion, sinceMs, onLeft]);

  const activePose = poseAt(
    motion,
    sinceMs,
    reduceMotion ? 0 : now - globalStartRef.current,
  );

  return (
    <View ref={heroRef} collapsable={false} style={styles.card}>
      <View
        testID='rest-scene'
        style={styles.canvasWrapper}
        onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      >
        <Svg width='100%' height='100%' viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <ClipPath id='canvasClip'>
              <Rect x={0} y={0} width={W} height={H} rx={radius.md} />
            </ClipPath>
            <LinearGradient id='restSky' x1='0' y1='0' x2='0' y2='1'>
              <Stop offset='0' stopColor={activePose.sky.top} />
              <Stop offset='1' stopColor={activePose.sky.horizon} />
            </LinearGradient>
            <LinearGradient id='restWater' x1='0' y1='0' x2='0' y2='1'>
              <Stop offset='0' stopColor={activePose.water.top} />
              <Stop offset='1' stopColor={activePose.water.bottom} />
            </LinearGradient>
            <DriftwoodDefs />
          </Defs>

          <G clipPath='url(#canvasClip)'>
            <Rect
              x={0}
              y={0}
              width={W}
              height={HORIZON}
              fill='url(#restSky)'
            />

            {STARS.map((star, idx) => (
              <Circle
                key={`star-${idx}`}
                cx={star.x}
                cy={star.y}
                r={star.r}
                fill={PAPER}
                opacity={
                  activePose.starOpacity * (activePose.twinkle[idx] ?? 1)
                }
              />
            ))}

            <Circle
              cx={70}
              cy={RestScenes.SUN_DAY_Y + activePose.sunDrop}
              r={18 * activePose.haloScale}
              fill={RestScenes.SUN.glow}
              opacity={activePose.haloOpacity * 0.4}
            />
            <Circle
              cx={70}
              cy={RestScenes.SUN_DAY_Y + activePose.sunDrop}
              r={RestScenes.SUN_RADIUS}
              fill={RestScenes.SUN.disc}
              opacity={0.9}
            />

            <Rect
              x={0}
              y={HORIZON}
              width={W}
              height={H - HORIZON}
              fill='url(#restWater)'
            />

            {SHIMMER.map((lineItem, idx) => (
              <Line
                key={`shimmer-${idx}`}
                x1={lineItem.x1 + (activePose.shimmer[idx] ?? 0)}
                y1={lineItem.y}
                x2={lineItem.x2 + (activePose.shimmer[idx] ?? 0)}
                y2={lineItem.y}
                stroke={RestScenes.SUN.disc}
                strokeWidth={1}
                opacity={0.35}
              />
            ))}

            {RIPPLES.map((rippleItem, idx) => (
              <Line
                key={`ripple-${idx}`}
                x1={rippleItem.x1 + (activePose.ripple[idx] ?? 0)}
                y1={rippleItem.y}
                x2={rippleItem.x2 + (activePose.ripple[idx] ?? 0)}
                y2={rippleItem.y}
                stroke={PAPER}
                strokeWidth={0.8}
                opacity={0.15}
              />
            ))}

            <Driftwood lap={activePose.ripple[1] ?? 0} float={activePose.driftwood} />
          </G>
        </Svg>

        <SpriteBird bird={activePose.bird} unit={unit} />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Icon name='weather-sunset' size={16} color={colors.glacier} />
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <Text style={styles.lineText}>{line}</Text>
        <Text style={styles.detailText}>{detail}</Text>

        {note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    // As wide as the week strip and the lists below, and set down the way the sky card was.
    marginTop: space.xs,
  },
  canvasWrapper: {
    position: 'relative',
    alignSelf: 'stretch',
    aspectRatio: W / H,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  birdFrame: {
    position: 'absolute',
    overflow: 'hidden',
  },
  textContainer: {
    marginTop: space.lg,
    paddingHorizontal: space.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  titleText: {
    fontFamily: font.display,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
  },
  lineText: {
    fontFamily: font.displayMedium,
    fontSize: 18,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: space.xs,
  },
  detailText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 20,
  },
  noteBox: {
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  noteText: {
    fontFamily: font.displayMedium,
    fontSize: 12,
    color: colors.ink3,
  },
});
