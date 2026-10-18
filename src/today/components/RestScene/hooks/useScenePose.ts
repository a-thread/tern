import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import {
  poseAt,
  RestScenes,
  SceneMotion,
  type ScenePose,
} from '@/today/models/restScene';

/**
 * Milliseconds between redraws: smooth in flight, slow while resting, when only the water, sun
 * and breathing drift and every redraw re-renders the whole scene.
 */
class Redraw {
  static readonly FLIGHT_MS = 33;
  static readonly REST_MS = 100;
}

/**
 * Where everything in the rest scene is, right now. The tern flies in when `entrance` is set
 * (with motion on), then rests; it takes off when `leaving` is set, and `onLeft` is called once
 * it has gone. `onTouchdown` is called as its feet touch the log (or at once if it never flew).
 */
export function useScenePose({
  entrance,
  leaving,
  onLeft,
  onTouchdown,
}: {
  entrance: boolean;
  leaving: boolean;
  onLeft: () => void;
  onTouchdown?: () => void;
}): ScenePose {
  const reduceMotion = useReduceMotion();

  // Flying in, then (the flight over) resting; the tern only flies with motion on.
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (!entrance) setLanded(false);
  }, [entrance]);
  const motion: SceneMotion = leaving
    ? SceneMotion.Leaving
    : entrance && !landed && !reduceMotion
      ? SceneMotion.Arriving
      : SceneMotion.Settled;

  const { sinceMs, clockMs } = useSceneClock(motion, reduceMotion);

  // The landing is over.
  useEffect(() => {
    if (motion === SceneMotion.Arriving && sinceMs >= RestScenes.FLIGHT_MS)
      setLanded(true);
  }, [motion, sinceMs]);

  // The feet touch: whatever waits for the landing (the waypoint feathers) can go.
  const touchdownRef = useRef(onTouchdown);
  touchdownRef.current = onTouchdown;
  useEffect(() => {
    if (!entrance) return;
    const touched =
      motion === SceneMotion.Settled ||
      (motion === SceneMotion.Arriving &&
        sinceMs >= RestScenes.FLIGHT_MS * RestScenes.TOUCHDOWN_K);
    if (touched) touchdownRef.current?.();
  }, [entrance, motion, sinceMs]);

  // The take-off is over: said once per take-off.
  const leftRef = useRef(false);
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

  return poseAt(motion, sinceMs, clockMs);
}

/**
 * The scene's two clocks: `sinceMs`, the time since the current motion began, and `clockMs`, a
 * running clock for the idle motion (0 with reduce motion on). They tick only while the screen
 * is showing and motion is allowed.
 */
function useSceneClock(motion: SceneMotion, reduceMotion: boolean) {
  const isFocused = useIsFocused();
  const [now, setNow] = useState(() => Date.now());
  const startRef = useRef(now);

  // Each new motion counts its time from the moment it begins. Noticed while rendering (React's
  // way of adjusting state to a change in what it reads), with the clock brought up to the same
  // instant so a motion never starts at a negative time.
  const [motionState, setMotionState] = useState({ motion, startedAt: now });
  if (motionState.motion !== motion) {
    const t = Date.now();
    setMotionState({ motion, startedAt: t });
    setNow(t);
  }

  useEffect(() => {
    if (!isFocused || reduceMotion) return;
    const gap =
      motion === SceneMotion.Settled ? Redraw.REST_MS : Redraw.FLIGHT_MS;
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

  return {
    sinceMs: Math.max(now - motionState.startedAt, 0),
    clockMs: reduceMotion ? 0 : now - startRef.current,
  };
}
