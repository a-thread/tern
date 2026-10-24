import { useEffect, useMemo, useRef } from 'react';
import { Animated, BackHandler, Dimensions, PanResponder } from 'react-native';

/** How close to the left edge a swipe has to start, like the system's own back swipe. */
const EDGE = 28;
/** A drag has to be mostly sideways before it takes over from scrolling. */
const SIDEWAYS = { MIN: 8, RATIO: 1.5 };

/**
 * Back for the sign-in screens, which sit outside the app's navigator and so get no swipe or
 * back button of their own: a swipe in from the left edge slides the screen away, and Android's
 * back button does the same. Without `onBack` (choosing a new password) there's no way back.
 */
export function useBackGesture(onBack?: () => void) {
  const x = useRef(new Animated.Value(0)).current;
  const latest = useRef(onBack);
  latest.current = onBack;

  useEffect(() => {
    if (!onBack) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      latest.current?.();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) =>
          latest.current !== undefined &&
          g.x0 <= EDGE &&
          g.dx > SIDEWAYS.MIN &&
          g.dx > Math.abs(g.dy) * SIDEWAYS.RATIO,
        onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx)),
        onPanResponderRelease: (_, g) => {
          const width = Dimensions.get('window').width;
          if (g.dx > width * 0.3 || g.vx > 0.5) {
            Animated.timing(x, {
              toValue: width,
              duration: 160,
              useNativeDriver: true,
            }).start(() => {
              latest.current?.();
              x.setValue(0);
            });
          } else {
            Animated.spring(x, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
        onPanResponderTerminate: () => x.setValue(0),
      }),
    [x],
  );

  return { panHandlers: pan.panHandlers, translateX: x };
}
