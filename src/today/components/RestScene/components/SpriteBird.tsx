import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { birdBox, Sprite, type ScenePose } from '@/today/models/restScene';

const SPRITE = require('../../../../../assets/tern-landing.png');

/**
 * The tern, from the landing sheet: one of its 18 frames shown through a window over the scene.
 * `unit` is screen pixels per scene unit. `birdBox` places the window so the feet land where
 * the pose says, whichever way it is turned.
 */
export function SpriteBird({
  bird,
  unit,
}: {
  bird: ScenePose['bird'];
  unit: number;
}) {
  const box = birdBox(bird, unit);

  return (
    <View
      pointerEvents='none'
      style={[
        styles.birdFrame,
        {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          transform: [
            { rotate: `${bird.pitch}deg` },
            { scaleX: bird.facing },
            { scaleY: bird.breath },
          ],
        },
      ]}
    >
      <Image
        source={SPRITE}
        resizeMode='stretch'
        fadeDuration={0}
        style={{
          position: 'absolute',
          top: 0,
          left: -bird.frame * box.width,
          width: box.width * Sprite.FRAMES,
          height: box.height,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  birdFrame: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
