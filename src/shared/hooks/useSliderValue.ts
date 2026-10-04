import { useMemo, useRef, useState } from 'react';
import { PanResponder, type LayoutChangeEvent } from 'react-native';

/** Manages a slider value locally while dragging and commits it on release. */
export function useSliderValue({
  value,
  min,
  max,
  step,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (next: number) => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const trackWidth = useRef(0);
  const start = useRef(value);
  const dragRef = useRef<number | null>(null);
  // The handlers below are created once, so they read the latest props from refs.
  const latest = useRef({ value, min, max, step, onCommit });
  latest.current = { value, min, max, step, onCommit };

  const snap = (v: number) => {
    const { min: lo, max: hi, step: st } = latest.current;
    return Math.round(Math.min(Math.max(v, lo), hi) / st) * st;
  };

  const finish = () => {
    const finalValue = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (finalValue !== null && finalValue !== latest.current.value) {
      latest.current.onCommit(finalValue);
    }
  };

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        // Keep the drag even if the ScrollView would like the gesture.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = latest.current.value;
        },
        onPanResponderMove: (_evt, gesture) => {
          if (!trackWidth.current) return;
          const { min: lo, max: hi } = latest.current;
          const next = snap(
            start.current + (gesture.dx / trackWidth.current) * (hi - lo),
          );
          // Only re-render when the snapped value actually changes.
          if (next !== dragRef.current) {
            dragRef.current = next;
            setDrag(next);
          }
        },
        onPanResponderRelease: finish,
        onPanResponderTerminate: finish,
      }).panHandlers,
    [],
  );

  const shown = drag ?? value;
  return {
    shown,
    fillPct: ((shown - min) / (max - min)) * 100,
    panHandlers,
    onLayout: (e: LayoutChangeEvent) => {
      trackWidth.current = e.nativeEvent.layout.width;
    },
  };
}
