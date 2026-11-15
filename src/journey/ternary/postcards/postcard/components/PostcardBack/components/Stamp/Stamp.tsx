import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { font, gradients, postcardColors, space } from '@shared/theme';
import { FlockLooks } from '@/journey/models/flockLooks';

/**
 * A postcard's stamp: the sender's own tern, in the colour they fly as in the flock, on a
 * scrap of Journey's night sky, inside a perforated edge.
 */
export function Stamp({ look }: { look: number }) {
  return (
    <View
      style={s.edge}
      accessible
      accessibilityLabel='Stamp: the sender’s tern'
    >
      <LinearGradient colors={[...gradients.journey]} style={s.sky}>
        <Image
          source={FlockLooks.source(look)}
          style={s.tern}
          accessibilityIgnoresInvertColors
        />
        <Text style={[s.word, { color: FlockLooks.color(look) }]}>TERN</Text>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  edge: {
    width: 64,
    height: 78,
    padding: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: postcardColors.rule,
    borderRadius: 3,
    backgroundColor: postcardColors.card,
  },
  sky: {
    flex: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tern: { width: 34, height: 34 },
  word: {
    fontFamily: font.bold,
    fontSize: 7,
    letterSpacing: 1,
    marginTop: space.xs / 2,
  },
});
