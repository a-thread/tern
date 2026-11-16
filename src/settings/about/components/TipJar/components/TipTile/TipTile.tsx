import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';

/**
 * One amount in the tip jar, shown as a fish that grows with the tip. Pressed, the tile gives
 * a little and the fish flips out of the water; with Reduce Motion on, neither moves.
 */
export function TipTile({
  price,
  fish,
  fishSize,
  busy,
  disabled,
  onPress,
}: {
  price: string;
  fish: string;
  fishSize: number;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const still = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;
  const leap = useRef(new Animated.Value(0)).current;

  const give = (to: number) => {
    if (still) return;
    Animated.spring(press, {
      toValue: to,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  const flip = () => {
    if (!still) {
      leap.setValue(0);
      Animated.timing(leap, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }).start();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={flip}
      onPressIn={() => give(1)}
      onPressOut={() => give(0)}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={`Tip ${price}: a ${fish}`}
      accessibilityState={{ busy, disabled }}
      style={s.press}
    >
      <Animated.View
        style={[
          s.tile,
          disabled && s.waiting,
          {
            transform: [
              {
                scale: press.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.95],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [
              {
                // Up out of the water and back, landing with a small splash of a bounce.
                translateY: leap.interpolate({
                  inputRange: [0, 0.4, 0.75, 0.9, 1],
                  outputRange: [0, -14, 0, -3, 0],
                }),
              },
              {
                rotate: leap.interpolate({
                  inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  outputRange: [
                    '0deg',
                    '-20deg',
                    '0deg',
                    '20deg',
                    '-8deg',
                    '0deg',
                  ],
                }),
              },
            ],
          }}
        >
          <Icon name='fish' size={fishSize} color={colors.sunDeep} />
        </Animated.View>
        <Text style={typography.caption}>A {fish}</Text>
        <Text style={typography.heading}>{price}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  press: { flex: 1 },
  tile: {
    flex: 1,
    minHeight: 84,
    paddingVertical: space.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  waiting: { opacity: 0.5 },
});
