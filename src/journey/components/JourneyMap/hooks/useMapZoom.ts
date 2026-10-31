import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  PanResponder,
  type View,
} from 'react-native';

import {
  clampZoom,
  type FramePoint,
  isWhole,
  type MapZoom,
  NO_ZOOM,
  zoomAbout,
  zoomBetween,
} from '../utils/mapZoom';

/** How long a double tap or the zoom button takes to glide. */
const ZOOM_MS = 360;

type Touch = { pageX: number; pageY: number };

/**
 * The map's zoom. It opens on `home` (the close-up on the current leg, turned to fly left to
 * right) and toggles between that and the whole route. Pinch to zoom anywhere in between, and
 * drag to look around once zoomed; at normal size a single finger is left alone, so taps still
 * name stops.
 *
 * The map draws itself at `zoom`, so it stays sharp at any zoom. Redrawing it is too slow to
 * follow a finger, though, so while a pinch, drag or glide is under way the drawing is moved as
 * a picture (`moveStyle`), and redrawn at the new zoom once it stops.
 *
 * A new `home` (the next leg) or `resetKey` (switching between the map and the globe) keeps to
 * whichever of the two was showing: the whole route stays the whole route, and anything else
 * becomes the new close-up, since a pinched zoom on one projection has no match on the other.
 */
export function useMapZoom({
  width,
  height,
  home,
  resetKey,
  onGestureStart,
}: {
  width: number;
  height: number;
  home: MapZoom;
  resetKey: unknown;
  /** Called as a pinch or drag begins, to clear anything placed for the old zoom. */
  onGestureStart: () => void;
}) {
  /** The zoom the map is drawn at. */
  const [zoom, setZoom] = useState<MapZoom>(NO_ZOOM);
  /** Where the map is headed: ahead of `zoom` during a glide, so the button changes on the tap. */
  const [aim, setAim] = useState<MapZoom>(NO_ZOOM);
  const drawn = useRef<MapZoom>(NO_ZOOM);
  drawn.current = zoom;
  // The picture's move on top of the drawing, between redraws.
  const scale = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(0)).current;
  /** The zoom as the fingers have it right now, ahead of `zoom`. */
  const live = useRef<MapZoom>(NO_ZOOM);
  /** The glide under way, if any, so a new view can cut it short. */
  const glide = useRef<Animated.CompositeAnimation | null>(null);
  /**
   * Whether the whole route was chosen, so it stays chosen across a new view or leg. Set only by
   * what the person does: before then the map opens on the close-up.
   */
  const chosenWhole = useRef(false);
  /** The frame's top-left corner on screen, to turn touches into frame points. */
  const origin = useRef<FramePoint>({ x: 0, y: 0 });
  const frameRef = useRef<View>(null);
  const start = useRef<{
    zoom: MapZoom;
    from: FramePoint;
    spread: number;
    fingers: number;
  } | null>(null);
  // The handlers are made once, so they read the latest size and callback from here.
  const latest = useRef({ width, height, onGestureStart });
  latest.current = { width, height, onGestureStart };

  /** Moves the picture so the drawing (at `zoom`) shows as `z`. */
  const move = (z: MapZoom) => {
    live.current = z;
    const d = zoomBetween(drawn.current, z);
    scale.setValue(d.scale);
    x.setValue(d.x);
    y.setValue(d.y);
    turn.setValue(d.rotate);
  };

  // Once the map has been redrawn at the new zoom, the picture goes back to where it started.
  useLayoutEffect(() => {
    scale.setValue(1);
    x.setValue(0);
    y.setValue(0);
    turn.setValue(0);
  }, [zoom, scale, x, y, turn]);

  /** Zooms to `z`: at once with `jump`, otherwise gliding there and then redrawing. */
  const settle = (z: MapZoom, jump = false) => {
    live.current = z;
    setAim(z);
    if (jump) {
      setZoom(z);
      return;
    }
    const d = zoomBetween(drawn.current, z);
    glide.current?.stop();
    const anim = Animated.parallel(
      (
        [
          [scale, d.scale],
          [x, d.x],
          [y, d.y],
          [turn, d.rotate],
        ] as const
      ).map(([value, to]) =>
        Animated.timing(value, {
          toValue: to,
          duration: ZOOM_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    );
    glide.current = anim;
    anim.start(({ finished }) => {
      if (finished) setZoom(z);
    });
  };

  // A new view or leg takes its zoom in the same render, not in an effect afterwards: otherwise
  // the new map is painted once at the old zoom, and flashes. Compared by value, since the
  // close-up is worked out afresh each render.
  const homeKey = `${home.scale},${home.x},${home.y},${home.rotate}`;
  const [seen, setSeen] = useState<{ homeKey: string; resetKey: unknown }>();
  if (seen?.homeKey !== homeKey || seen?.resetKey !== resetKey) {
    const z = chosenWhole.current ? NO_ZOOM : home;
    setSeen({ homeKey, resetKey });
    setZoom(z);
    setAim(z);
  }
  // Then the gesture state catches up, and a glide still running for the old view is dropped.
  useLayoutEffect(() => {
    glide.current?.stop();
    live.current = aim;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a new view or leg arrives
  }, [seen]);

  /** Goes to `z` because the person asked to, remembering whether that's the whole route. */
  const choose = (z: MapZoom) => {
    chosenWhole.current = isWhole(z);
    settle(z);
  };

  const framePoint = (t: Touch): FramePoint => ({
    x: t.pageX - origin.current.x,
    y: t.pageY - origin.current.y,
  });

  const begin = (touches: readonly Touch[]) => {
    const [a, b] = touches.map(framePoint);
    start.current = b
      ? {
          zoom: live.current,
          from: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          spread: Math.hypot(b.x - a.x, b.y - a.y) || 1,
          fingers: 2,
        }
      : { zoom: live.current, from: a, spread: 0, fingers: 1 };
  };

  const finish = () => {
    start.current = null;
    chosenWhole.current = isWhole(live.current);
    setAim(live.current);
    setZoom(live.current);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Two fingers always pinch; one finger drags only once zoomed in.
        onMoveShouldSetPanResponderCapture: (e, g) =>
          e.nativeEvent.touches.length >= 2 ||
          (live.current.scale > 1 && Math.hypot(g.dx, g.dy) > 6),
        onPanResponderGrant: (e) => {
          latest.current.onGestureStart();
          begin(e.nativeEvent.touches);
        },
        onPanResponderMove: (e) => {
          const touches = e.nativeEvent.touches;
          const { width: w, height: h } = latest.current;
          const fingers = touches.length >= 2 ? 2 : 1;
          // A finger landing or lifting mid-gesture starts again from here, without a jump.
          if (!start.current || start.current.fingers !== fingers) {
            begin(touches);
            return;
          }
          const s = start.current;
          const [a, b] = touches.map(framePoint);
          if (b) {
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const spread = Math.hypot(b.x - a.x, b.y - a.y);
            move(
              zoomAbout(
                s.zoom,
                s.from,
                mid,
                (s.zoom.scale * spread) / s.spread,
                w,
                h,
              ),
            );
          } else {
            move(
              clampZoom(
                {
                  ...s.zoom,
                  x: s.zoom.x + a.x - s.from.x,
                  y: s.zoom.y + a.y - s.from.y,
                },
                w,
                h,
              ),
            );
          }
        },
        onPanResponderRelease: finish,
        onPanResponderTerminate: finish,
        // Once the map has the fingers, the page doesn't take them back mid-pinch.
        onPanResponderTerminationRequest: () => false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads everything through refs
    [],
  );

  const whole = isWhole(aim);
  return {
    /** The zoom the map is drawn at: its dots, line widths and labels are placed for this. */
    zoom,
    /** Where a tap landed in the frame. */
    tapPoint: (e: GestureResponderEvent) => framePoint(e.nativeEvent),
    /**
     * Zooms by `factor` about a point in the frame, from wherever the map is headed, gliding
     * there. Zoomed all the way out it's the whole route, north up.
     */
    zoomBy: (factor: number, about: FramePoint) => {
      const to = live.current.scale * factor;
      choose(
        to <= 1.001
          ? NO_ZOOM
          : zoomAbout(live.current, about, about, to, width, height),
      );
    },
    /** Showing the whole route, at normal size and north up. */
    whole,
    /** From the whole route to the close-up, or from anywhere else out to the whole route. */
    toggleWhole: () => choose(whole ? home : NO_ZOOM),
    frameProps: {
      ref: frameRef,
      // Page coordinates, the same ones touches report.
      onLayout: () =>
        frameRef.current?.measure?.((_x, _y, _w, _h, pageX, pageY) => {
          origin.current = { x: pageX, y: pageY };
        }),
      ...responder.panHandlers,
    },
    /** The picture's move while a gesture or glide is under way; still otherwise. */
    moveStyle: {
      transformOrigin: 'top left' as const,
      transform: [
        { translateX: x },
        { translateY: y },
        {
          rotate: turn.interpolate({
            inputRange: [-360, 360],
            outputRange: ['-360deg', '360deg'],
          }),
        },
        { scale },
      ],
    },
  };
}
