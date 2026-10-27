import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '../../theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import type { Rect } from '../../utils/measureInWindow';

/** Room the card needs below its anchor before it flips above it instead. */
const CARD_ROOM = 170;
const GAP = 18;
/** Room around the thing pointed at, inside the outline. */
const HOLE_PAD = 6;
/**
 * Dark enough that the page underneath recedes, so text peeking past the card reads as
 * background rather than as part of the tip.
 */
const SCRIM = 'rgba(38,38,43,0.68)';

/**
 * A one-time tip over a screen: the whole window dims, what it points at shows through an
 * outlined window, and a short card beside it has "Got it" and "Skip tips". It holds
 * screen-reader focus until dismissed, and fades in unless Reduce Motion is on. `rect` (from
 * `measureInWindow`) is null when there's nothing to point at.
 */
export function TipOverlay({
  rect: measured,
  lead,
  rest,
  position,
  total,
  onGotIt,
  onSkip,
}: {
  rect: Rect | null;
  /** The first words, in bold. */
  lead: string;
  rest: string;
  /** 1-based, of `total`. */
  position: number;
  total: number;
  onGotIt: () => void;
  onSkip: () => void;
}) {
  const still = useReduceMotion();
  const fade = useRef(new Animated.Value(still ? 1 : 0)).current;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { height } = size;
  // On Android a measured position counts from below the status bar, while this full-screen
  // modal draws from the very top, so move it down by the status bar to line up.
  const rect = measured && {
    ...measured,
    y:
      measured.y +
      (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0),
  };
  const last = position === total;

  useEffect(() => {
    if (still) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [lead, still, fade]);

  const hole = rect && {
    top: rect.y - HOLE_PAD,
    bottom: rect.y + rect.height + HOLE_PAD,
    left: rect.x - HOLE_PAD,
    right: rect.x + rect.width + HOLE_PAD,
  };
  // Below what it points at when there's room, else above; with nothing to point at, a
  // little above the middle.
  const cardPlace = !rect
    ? { top: '38%' as const }
    : height === 0 || rect.y + rect.height + CARD_ROOM < height
      ? { top: rect.y + rect.height + GAP }
      : { bottom: height - rect.y + GAP };

  return (
    // A transparent modal, so the dimming covers the whole window, tab bar and all, and
    // Android's back button dismisses the tip.
    <Modal
      transparent
      visible
      animationType='none'
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onGotIt}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: fade }]}
        onLayout={(e) => setSize(e.nativeEvent.layout)}
        accessibilityViewIsModal
      >
        {/* Dimmed all round, with a clear window over what the tip is about, its corners
          rounded to match the outline. */}
        <Svg
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
          <Path
            d={scrimWithHole(size.width, size.height, hole, radius.md)}
            fill={SCRIM}
            fillRule='evenodd'
          />
        </Svg>
        {hole ? (
          <View
            pointerEvents='none'
            style={[
              s.outline,
              {
                left: hole.left,
                top: hole.top,
                width: hole.right - hole.left,
                height: hole.bottom - hole.top,
              },
            ]}
          />
        ) : null}
        <View style={[s.card, cardPlace]} accessibilityLiveRegion='polite'>
          <Text style={s.text}>
            <Text style={s.lead}>{lead}</Text> {rest}
          </Text>
          <View style={s.actions}>
            {last ? (
              <Text style={s.count}>{`${position} of ${total}`}</Text>
            ) : (
              <Pressable
                onPress={onSkip}
                hitSlop={10}
                accessibilityRole='button'
              >
                <Text
                  style={s.count}
                >{`${position} of ${total} · Skip tips`}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onGotIt}
              hitSlop={10}
              accessibilityRole='button'
            >
              <Text style={s.gotIt}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

/**
 * The whole screen with a rounded-rectangle hole cut out (even-odd fill: the inner shape
 * subtracts from the outer one).
 */
function scrimWithHole(
  width: number,
  height: number,
  h: { top: number; bottom: number; left: number; right: number } | null,
  r: number,
): string {
  const screen = `M0 0 H${width} V${height} H0 Z`;
  if (!h) return screen;
  return [
    screen,
    `M${h.left + r} ${h.top} H${h.right - r}`,
    `A${r} ${r} 0 0 1 ${h.right} ${h.top + r} V${h.bottom - r}`,
    `A${r} ${r} 0 0 1 ${h.right - r} ${h.bottom} H${h.left + r}`,
    `A${r} ${r} 0 0 1 ${h.left} ${h.bottom - r} V${h.top + r}`,
    `A${r} ${r} 0 0 1 ${h.left + r} ${h.top} Z`,
  ].join(' ');
}

const s = StyleSheet.create({
  outline: {
    position: 'absolute',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.sun,
  },
  card: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  text: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.paper,
  },
  lead: { fontFamily: font.semibold },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.md,
  },
  count: { fontFamily: font.body, fontSize: 12.5, color: colors.ink3 },
  gotIt: { fontFamily: font.semibold, fontSize: 14, color: colors.sun },
});
