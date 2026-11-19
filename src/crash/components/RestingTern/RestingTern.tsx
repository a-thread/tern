import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '@shared/theme';

const SPRITE = require('../../../../assets/tern-landing.png');

class LandingSprite {
  static readonly FRAMES = 18;
  static readonly CELL = { w: 2416 / 18, h: 130 };
  /** The last frame: standing, wings folded. */
  static readonly REST_FRAME = 17;
  /** How far down the cell the feet are. */
  static readonly FEET_Y = 87 / 130;
}

/** A still tern standing on a line of ground; decoration only. */
export default function RestingTern({ width = 120 }: { width?: number }) {
  const height = (width * LandingSprite.CELL.h) / LandingSprite.CELL.w;
  const feet = height * LandingSprite.FEET_Y;
  return (
    <View
      style={{ width, height: feet + 2 }}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
    >
      <View style={[s.frame, { width, height }]}>
        <Image
          source={SPRITE}
          resizeMode='stretch'
          fadeDuration={0}
          style={{
            position: 'absolute',
            left: -LandingSprite.REST_FRAME * width,
            width: width * LandingSprite.FRAMES,
            height,
          }}
        />
      </View>
      <View style={[s.ground, { top: feet }]} />
    </View>
  );
}

const s = StyleSheet.create({
  frame: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
});
