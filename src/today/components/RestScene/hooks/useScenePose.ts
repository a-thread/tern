import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import {
  poseAt,
  RestScenes,
  SceneMotion,
  type ScenePose,
} from '@/today/models/restScene';

/** Slow while resting, since every redraw re-renders the whole scene. */
class Redraw {
  static readonly FLIGHT_MS = 33;
  static readonly REST_MS = 100;
}

/** `onTouchdown` fires as the feet land (at once if it never flew); `onLeft` once it's gone. */
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

/** `sinceMs` since the motion began, `clockMs` for idle motion; tick only on screen with motion on. */
function useSceneClock(motion: SceneMotion, reduceMotion: boolean) {
  const isFocused = useIsFocused();
  const [now, setNow] = useState(() => Date.now());
  const startRef = useRef(now);

  // Reset during render, syncing the clock so a motion never starts at a negative time.
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
