import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { FadeIn } from '@shared/components/FadeIn/FadeIn';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';

/**
 * The thank-you after a tip. It stays in the card rather than fading like a toast: it rises
 * in, and the heart beats twice. With Reduce Motion on, it simply appears.
 */
export function TipThanks({ text }: { text: string }) {
  const still = useReduceMotion();
  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) return;
    const pulse = () =>
      Animated.sequence([
        Animated.timing(beat, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]);
    const anim = Animated.sequence([Animated.delay(250), pulse(), pulse()]);
    anim.start();
    return () => anim.stop();
  }, [still, beat]);

  return (
    <FadeIn style={s.thanks}>
      <Animated.View
        style={{
          transform: [
            {
              scale: beat.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.35],
              }),
            },
          ],
        }}
      >
        <Icon name='heart-outline' size={16} color={colors.aurora} />
      </Animated.View>
      <Text style={s.text} accessibilityLiveRegion='polite'>
        {text}
      </Text>
    </FadeIn>
  );
}

const s = StyleSheet.create({
  thanks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.auroraTint,
    borderRadius: radius.md,
  },
  text: { ...typography.meta, color: colors.aurora, flex: 1 },
});
