import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { gradients } from '@shared/theme';
import { FlockLooks } from '../../../models/flockLooks';

/**
 * A friend's bird as it flies on the map, on a scrap of Journey's night sky so its light
 * colour reads on a card. Matches the map, so the list and the flock agree on who's who.
 */
export function FlockBadge({
  look,
  faint,
  size = 28,
}: {
  look: number;
  faint?: boolean;
  /** The badge's width; the bird fills about 70% of it. */
  size?: number;
}) {
  const bird = Math.round(size * 0.7);
  return (
    <View
      style={[
        s.sky,
        { width: size, height: size, borderRadius: size / 2 },
        faint && s.faint,
      ]}
    >
      <Image
        source={FlockLooks.source(look)}
        style={{ width: bird, height: bird }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const s = StyleSheet.create({
  sky: {
    backgroundColor: gradients.journey[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  faint: { opacity: 0.6 },
});
