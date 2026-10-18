import React, { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors, radius, space } from '@shared/theme';
import { useScenePose } from './hooks/useScenePose';
import { SceneBackdrop } from './components/SceneBackdrop';
import { SpriteBird } from './components/SpriteBird';
import { RestCaption } from './components/RestCaption';
import { SceneCanvas } from './models/sceneCanvas';

interface RestSceneProps {
  /** Where the waypoint feathers start from when resting earns its waypoints. */
  heroRef?: React.RefObject<View | null>;
  /** True when the rest day has just been taken: the tern flies in and lands. */
  entrance: boolean;
  /** True once the rest day is undone: the tern takes off, then `onLeft` is called. */
  leaving: boolean;
  onLeft: () => void;
  /** Called when the tern's feet touch the log after flying in (or at once if it never flew). */
  onTouchdown?: () => void;
  title: string;
  line: string;
  detail: string;
  note?: string;
}

/**
 * The rest day card: the tern on its driftwood at dusk, over a few words about the day. It flies
 * in when the rest is taken here and off again when it is undone.
 */
export function RestScene({
  heroRef,
  entrance,
  leaving,
  onLeft,
  onTouchdown,
  title,
  line,
  detail,
  note,
}: RestSceneProps) {
  const pose = useScenePose({ entrance, leaving, onLeft, onTouchdown });
  const { width: windowWidth } = useWindowDimensions();

  // The scene fills the card, whatever its width. Until it has been measured, estimate it from
  // the screen: Today's side padding, then the card's own.
  const [measured, setMeasured] = useState(0);
  const unit =
    (measured || windowWidth - 2 * (space.lg + space.md)) / SceneCanvas.WIDTH;

  return (
    <View ref={heroRef} collapsable={false} style={styles.card}>
      <View
        testID='rest-scene'
        style={styles.canvasWrapper}
        onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      >
        <SceneBackdrop pose={pose} />
        <SpriteBird bird={pose.bird} unit={unit} />
      </View>

      <RestCaption title={title} line={line} detail={detail} note={note} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    // As wide as the week strip and the lists below, and set down the way the sky card was.
    marginTop: space.xs,
  },
  canvasWrapper: {
    position: 'relative',
    alignSelf: 'stretch',
    aspectRatio: SceneCanvas.WIDTH / SceneCanvas.HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
