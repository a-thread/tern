import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { useIsFocused } from '@react-navigation/native';

import { font, radius, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { poseAt, RestScenes, type SceneMotion } from '@today/models/restScene';

const W = 260;
const H = 132;
const HORIZON = 82;
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

/** Re-renders on every animation frame (at most `fps` a second) while `running`; returns the time, ms. */
function useFrameClock(running: boolean, fps: number): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!running) return;
    const gap = 1000 / fps;
    let last = 0;
    // The same clock as `performance.now()` at mount, whatever timestamp a frame is handed.
    let frame = requestAnimationFrame(function tick() {
      const t = performance.now();
      if (t - last >= gap) {
        last = t;
        setNow(t);
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [running, fps]);
  return now;
}

type Props = {
  /** Where the waypoint feathers start from when resting earns its waypoints. */
  heroRef?: React.RefObject<View | null>;
  /** `arrive` when the rest day has just been taken: the tern flies in. Read once, on mount. */
  entrance?: 'arrive' | 'settled';
  /** True once the rest day is undone: the tern flies off, then `onLeft` is called. */
  leaving?: boolean;
  onLeft?: () => void;
  title: string;
  line: string;
  detail?: string;
  /** A small line with a muted bell, e.g. that reminders are quiet. */
  note?: string;
};

/**
 * The rest day, in place of the sky card: a tern on driftwood by the water at dusk. Taking the
 * day, the sky eases to dusk as the tern flies in and lands; undoing it, the tern flies off.
 * Resting, only small things move: the sun's glow, the water, the tern breathing and blinking.
 * With reduce motion on, the scene doesn't move at all.
 */
export function RestScene({ heroRef, entrance = 'settled', leaving = false, onLeft, title, line, detail, note }: Props) {
  const still = useReduceMotion();
  const focused = useIsFocused();
  const [motion, setMotion] = useState<SceneMotion>(entrance === 'arrive' ? 'arriving' : 'settled');
  const motionStart = useRef(performance.now());
  const onLeftRef = useRef(onLeft);
  onLeftRef.current = onLeft;

  const flying = motion !== 'settled';
  const now = useFrameClock(!still && focused, flying ? 30 : 20);

  // Reduce motion (read a moment after mounting) means no flight.
  useEffect(() => {
    if (still && motion === 'arriving') setMotion('settled');
  }, [still, motion]);

  useEffect(() => {
    if (!leaving) return;
    if (still) {
      onLeftRef.current?.();
      return;
    }
    motionStart.current = performance.now();
    setMotion('leaving');
  }, [leaving, still]);

  useEffect(() => {
    if (!flying || now - motionStart.current < RestScenes.FLIGHT_MS) return;
    if (motion === 'arriving') setMotion('settled');
    else onLeftRef.current?.();
  }, [now, flying, motion]);

  const pose = poseAt(motion, now - motionStart.current, still ? 0 : now);
  const b = pose.bird;

  return (
    <View ref={heroRef} collapsable={false} style={[s.card, { backgroundColor: pose.waterColor }]}>
      <View style={{ aspectRatio: W / H }}>
        <Svg width='100%' height='100%' viewBox={`0 0 ${W} ${H}`} accessibilityLabel='A tern resting on driftwood by the water'>
          <Defs>
            <ClipPath id='restAbove'>
              <Rect x={0} y={0} width={W} height={HORIZON} />
            </ClipPath>
          </Defs>
          <Rect x={0} y={0} width={W} height={HORIZON} fill={pose.skyColor} />
          <G opacity={pose.starOpacity}>
            {STARS.map((st, i) => (
              <Circle key={i} cx={st.x} cy={st.y} r={st.r} fill={PAPER} opacity={pose.twinkle[i]} />
            ))}
          </G>
          <G clipPath='url(#restAbove)'>
            <G transform={`translate(0 ${pose.sunDrop})`}>
              <G transform={`translate(70 40) scale(${pose.haloScale}) translate(-70 -40)`} opacity={pose.haloOpacity}>
                <Circle cx={70} cy={40} r={27} fill='rgba(255,226,180,0.28)' />
              </G>
              <Circle cx={70} cy={40} r={15} fill='#F2D3A6' />
            </G>
          </G>
          <Rect x={0} y={HORIZON} width={W} height={1.2} fill='rgba(255,255,255,0.35)' />
          {SHIMMER.map(({ x1, x2, y }, i) => (
            <Line key={i} x1={x1} x2={x2} y1={y} y2={y} stroke='rgba(255,255,255,0.4)' strokeWidth={1.6} strokeLinecap='round' transform={`translate(${pose.shimmer[i]} 0)`} />
          ))}
          {RIPPLES.map(({ x1, x2, y }, i) => (
            <Line key={i} x1={x1} x2={x2} y1={y} y2={y} stroke='rgba(255,255,255,0.2)' strokeWidth={1.4} strokeLinecap='round' transform={`translate(${pose.ripple[i]} 0)`} />
          ))}
          <Rect x={124} y={79} width={62} height={8} rx={4} fill='#3E322B' />

          <G transform={`translate(${b.x} ${b.y}) rotate(${b.pitch}) scale(${b.facing} 1)`}>
            <G transform={`rotate(${b.tailFlick} -13 -12)`}>
              <Path d='M-13 -13 L-30 -9 L-13 -8 Z' fill={PAPER} />
            </G>
            <Path d='M-2 -8 v8 M4 -8 v8' stroke='#D8431F' strokeWidth={1.6} strokeLinecap='round' />
            <G transform={`translate(0 -10) scale(${b.breathX} ${b.breathY}) translate(0 10)`}>
              <Ellipse cx={0} cy={-14} rx={15} ry={8} fill={PAPER} />
              <G transform={`translate(-1 -17) rotate(${b.wingRotate}) scale(${b.wingScaleX} ${b.wingScaleY})`}>
                <Path d='M0 0 Q-6 -13 0 -27 Q6 -13 0 0' fill='#E3DDD2' />
              </G>
            </G>
            <G transform={`translate(9 -18) rotate(${b.headTilt}) translate(-9 18)`}>
              <Circle cx={14} cy={-21} r={6.5} fill={PAPER} />
              <Path d='M12 -26 q4 -4 9 -1 q-4 1 -9 4z' fill='#2B2B30' />
              <Path d='M19 -21.5 l8 1.5 l-8 2z' fill='#D8431F' />
              <G transform={`translate(15.5 -22) scale(1 ${b.blink}) translate(-15.5 22)`}>
                <Circle cx={15.5} cy={-22} r={1.2} fill='#2B2B30' />
              </G>
            </G>
          </G>
        </Svg>
      </View>
      <View style={s.text}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.line}>{line}</Text>
        {detail ? <Text style={s.detail}>{detail}</Text> : null}
        {note ? (
          <View style={s.note}>
            <Icon name='bell-off-outline' size={13} color='rgba(251,250,247,0.7)' />
            <Text style={s.noteText}>{note}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden', marginTop: space.xs },
  text: { alignItems: 'center', paddingHorizontal: space.lg, paddingTop: 2, paddingBottom: space.lg },
  title: { fontFamily: font.displayMedium, fontSize: 24, color: PAPER, marginTop: 4 },
  line: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: 'rgba(251,250,247,0.82)', textAlign: 'center', marginTop: 4 },
  detail: { fontFamily: font.body, fontSize: 12, color: 'rgba(251,250,247,0.7)', marginTop: 12 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  noteText: { fontFamily: font.body, fontSize: 11.5, color: 'rgba(251,250,247,0.7)' },
});
