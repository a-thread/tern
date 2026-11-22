import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '@shared/theme';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { FlockLooks } from '@/journey/models/flockLooks';
import { FlockBadge } from '@/journey/ternary/components/FlockBadge/FlockBadge';

class CellSizes {
  static readonly BADGE = 48;
  static readonly RING = 3;
  /** The space between the ring and the badge. */
  static readonly INSET = 2;
  static readonly OUTER =
    CellSizes.BADGE + (CellSizes.RING + CellSizes.INSET) * 2;
}

/** One bird to choose: it hops and its ring eases in when picked, and fades when not. */
export function LookCell({
  look,
  chosen,
  off,
  onChoose,
}: {
  look: number;
  chosen: boolean;
  /** A friend flies it, so it can't be chosen. */
  off: boolean;
  onChoose: () => void;
}) {
  const still = useReduceMotion();
  const on = useRef(new Animated.Value(chosen ? 1 : 0)).current;
  const was = useRef(chosen);

  useEffect(() => {
    if (was.current === chosen) return;
    was.current = chosen;
    if (still || !chosen) return on.setValue(chosen ? 1 : 0);
    on.setValue(0);
    Animated.spring(on, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [chosen, still, on]);

  const name = FlockLooks.nameOf(look);
  return (
    <Pressable
      style={[s.cell, off && s.off]}
      onPress={() => {
        if (chosen) return;
        Haptics.selectionAsync().catch(() => {});
        onChoose();
      }}
      disabled={off}
      accessibilityRole='radio'
      accessibilityState={{ checked: chosen, disabled: off }}
      accessibilityLabel={off ? `${name}, a friend flies it` : name}
    >
      <Animated.View
        style={[
          s.ring,
          {
            opacity: on.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: on.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.25, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            {
              scale: on.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [1, 0.85, 1],
              }),
            },
            {
              rotate: on.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['0deg', '-12deg', '0deg'],
              }),
            },
          ],
        }}
      >
        <FlockBadge look={look} size={CellSizes.BADGE} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  // A quarter of the row each, so four sit across whatever the width.
  cell: {
    width: '25%',
    height: CellSizes.OUTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: CellSizes.OUTER,
    height: CellSizes.OUTER,
    borderRadius: CellSizes.OUTER / 2,
    borderWidth: CellSizes.RING,
    borderColor: colors.coral,
  },
  off: { opacity: 0.35 },
});
