import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Eases the displayed integer toward `value` whenever it changes, instead of
 * snapping — used anywhere a waypoint total updates on screen so an earned
 * gain reads as a gain, not a silent re-render.
 */
export function useAnimatedNumber(value: number, duration = 650) {
  const [display, setDisplay] = useState(value);
  const anim = useRef(new Animated.Value(value)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    anim.setValue(prevValue.current);
    const listenerId = anim.addListener(({ value: v }) =>
      setDisplay(Math.round(v)),
    );
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      anim.removeListener(listenerId);
      setDisplay(value);
    });
    prevValue.current = value;
    return () => anim.removeListener(listenerId);
  }, [value, duration, anim]);

  return display;
}

/** A scale bounce that fires only when the watched value goes up — not on mount, not on decrease. */
export function usePulseOnIncrease(value: number) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) {
      scale.setValue(1);
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 140,
          useNativeDriver: false,
        }),
      ]).start();
    }
    prevValue.current = value;
  }, [value, scale]);

  return scale;
}

/**
 * Counts an integer up from 0 to `target`, and does it again whenever
 * `replayKey` changes — for numbers that should roll up each time their
 * screen comes into view.
 */
export function useCountUp(target: number, replayKey = 0, duration = 1800) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const anim = new Animated.Value(0);
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(anim, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setDisplay(target);
    });
    return () => anim.removeListener(id);
  }, [target, replayKey, duration]);

  return display;
}
