import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { gradients } from '@shared/theme';
import { FlockLooks } from '../../../models/flockLooks';

/**
 * A friend's bird as it flies on the map, on a scrap of Journey's night sky so its light
 * colour reads on a card. Matches the map, so the list and the flock agree on who's who.
 */
export function FlockBadge({ look, faint }: { look: number; faint?: boolean }) {
  return (
    <View style={[s.sky, faint && s.faint]}>
      <Image
        source={FlockLooks.source(look)}
        style={s.bird}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const s = StyleSheet.create({
  sky: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: gradients.journey[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  faint: { opacity: 0.6 },
  bird: { width: 20, height: 20 },
});
