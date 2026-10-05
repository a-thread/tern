import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReduceMotion } from '@shared/hooks/useReduceMotion';

// bird-sprite.png: 16 frames, each 260 x 560 px, laid out horizontally (4160 x 560).
// The beak is anchored at the same pixel in every cell, so the bird stays put.
const SPRITE = require('../../../assets/bird-sprite.png');
const FRAME_COUNT = 16;
const FRAME_ASPECT = 560 / 260;
const FRAME_MS = 55;

// Ping-pong order: 0..15..1, so the last frame never jumps back to the first.
const SEQUENCE: number[] = [
  ...Array.from({ length: FRAME_COUNT }, (_, i) => i),
  ...Array.from({ length: FRAME_COUNT - 2 }, (_, i) => FRAME_COUNT - 2 - i),
];

interface LoadingBirdProps {
  /** Width of the bird in points. The footprint is a square this size; the wings sweep past it vertically. */
  size?: number;
  /** Flat colour for the silhouette. Leave out to keep the sprite's own orange. */
  color?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  /** Wingbeat speed: 1 is normal, 1.2 a fifth faster. Birds on one screen shouldn't flap in step. */
  speed?: number;
  /** Wait this long (ms) before the first beat. */
  delay?: number;
  /** Scenery rather than a loading signal: left out for screen readers. */
  decorative?: boolean;
}

export default function LoadingBird({
  size = 56,
  color,
  label = 'Loading',
  style,
  speed = 1,
  delay = 0,
  decorative = false,
}: LoadingBirdProps) {
  const still = useReduceMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (still) {
      setStep(0);
      return;
    }
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(
        () => setStep((s) => (s + 1) % SEQUENCE.length),
        FRAME_MS / speed,
      );
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [still, speed, delay]);

  // One uniform scale on both axes, so the bird is never squished.
  const frameW = size;
  const frameH = size * FRAME_ASPECT;
  const frame = SEQUENCE[step];

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'progressbar'}
      accessibilityLabel={decorative ? undefined : label}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[styles.container, { width: size, height: size }, style]}
    >
      {/* Fixed clipping window onto the sheet: never moves, never scales. */}
      <View
        pointerEvents='none'
        style={[
          styles.viewport,
          { width: frameW, height: frameH, top: (size - frameH) / 2 },
        ]}
      >
        <Image
          source={SPRITE}
          resizeMode='stretch'
          tintColor={color}
          style={{
            position: 'absolute',
            top: 0,
            left: -frame * frameW,
            width: frameW * FRAME_COUNT,
            height: frameH,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
});
