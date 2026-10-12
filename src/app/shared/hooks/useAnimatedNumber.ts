import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** Limit display updates so the number remains readable. */
const NUMBER_UPDATE_MS = 66;

/**
 * Animate the displayed integer toward `value` instead of snapping to it.
 */
export function useAnimatedNumber(value: number, duration = 650) {
  const [display, setDisplay] = useState(value);
  const anim = useRef(new Animated.Value(value)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    anim.setValue(prevValue.current);
    let lastAt = 0;
    const listenerId = anim.addListener(({ value: v }) => {
      const now = Date.now();
      if (now - lastAt < NUMBER_UPDATE_MS) return;
      lastAt = now;
      setDisplay(Math.round(v));
    });
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      anim.removeListener(listenerId);
      if (finished) setDisplay(value);
    });
    prevValue.current = value;
    return () => {
      anim.removeListener(listenerId);
      // Stop the animation to prevent updates after unmount.
      anim.stopAnimation();
    };
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
 * screen comes into view. Use through `<CountUp>` so only a Text re-renders.
 */
export function useCountUp(target: number, replayKey = 0, duration = 1800) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const anim = new Animated.Value(0);
    let lastAt = 0;
    const id = anim.addListener(({ value }) => {
      const now = Date.now();
      if (now - lastAt < NUMBER_UPDATE_MS) return;
      lastAt = now;
      setDisplay(Math.round(value));
    });
    Animated.timing(anim, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setDisplay(target);
    });
    return () => {
      anim.removeListener(id);
      anim.stopAnimation();
    };
  }, [target, replayKey, duration]);

  return display;
}
