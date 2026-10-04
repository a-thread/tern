import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';

/** How far a row slides to show its Remove button. */
const ACTION_WIDTH = 88;
/** A drag has to be mostly sideways before it takes over from scrolling. */
const SIDEWAYS = { MIN: 8, RATIO: 1.5 };

/**
 * A list row that slides left to reveal a Remove button, so an item can be
 * removed without opening it. Tapping the row while the button is showing
 * slides it shut instead of opening the item. The button is hidden from screen
 * readers until it is showing; they remove an item from its edit screen.
 */
export function SwipeToRemove({
  children,
  onRemove,
  label = 'Remove',
}: {
  children: React.ReactNode;
  onRemove: () => void;
  /** The button's text. */
  label?: string;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const start = useRef(0);
  const current = useRef(0);
  const [open, setOpen] = useState(false);

  const settle = (to: number) => {
    current.current = to;
    setOpen(to !== 0);
    Animated.spring(x, { toValue: to, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > SIDEWAYS.MIN && Math.abs(g.dx) > Math.abs(g.dy) * SIDEWAYS.RATIO,
        onPanResponderGrant: () => {
          start.current = current.current;
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(0, Math.max(-ACTION_WIDTH, start.current + g.dx));
          x.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const at = Math.min(0, Math.max(-ACTION_WIDTH, start.current + g.dx));
          settle(at < -ACTION_WIDTH / 2 || g.vx < -0.5 ? -ACTION_WIDTH : 0);
        },
        onPanResponderTerminate: () => settle(0),
      }),
    // `settle` only touches refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View style={s.wrap}>
      <View style={s.action}>
        <Pressable
          onPress={onRemove}
          style={s.actionBtn}
          accessibilityRole='button'
          accessibilityLabel={label}
          importantForAccessibility={open ? 'yes' : 'no-hide-descendants'}
        >
          <Text style={s.actionText}>{label}</Text>
        </Pressable>
      </View>
      <Animated.View style={[s.front, { transform: [{ translateX: x }] }]} {...pan.panHandlers}>
        {children}
        {open ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => settle(0)}
            accessibilityLabel='Close'
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  front: { backgroundColor: colors.card },
  action: { ...StyleSheet.absoluteFillObject, alignItems: 'flex-end', backgroundColor: '#B3261E' },
  actionBtn: { width: ACTION_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: font.semibold, fontSize: 13.5, color: '#fff' },
});
