import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, space } from '@shared/theme';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { FlockLooks } from '@/journey/models/flockLooks';
import { FlockBadge } from '../FlockBadge/FlockBadge';

const LOOKS = Array.from({ length: TernaryRules.LOOKS }, (_, look) => look);

/** Each bird's badge, and the ring around the chosen one. */
class LookSizes {
  static readonly BADGE = 48;
  static readonly RING = 3;
  /** The space between the ring and the badge. */
  static readonly INSET = 2;
}

/**
 * Choosing the bird you fly as in a ternary: each pose in its own colour, as it flies on the
 * map, in two rows of four, with a ring around the one chosen. Its colour's name is said to a
 * screen reader ("Mint tern"); the page can show it beside its label. Birds a friend already
 * flies (`taken`) are faded and can't be chosen.
 */
export function LookChoice({
  value,
  onChange,
  taken,
}: {
  value: number;
  onChange: (look: number) => void;
  taken?: ReadonlySet<number>;
}) {
  return (
    <View accessibilityRole='radiogroup' style={s.grid}>
      {LOOKS.map((look) => {
        const chosen = look === value;
        const off = Boolean(taken?.has(look)) && !chosen;
        const name = FlockLooks.nameOf(look);
        return (
          <Pressable
            key={look}
            style={[s.cell, off && s.off]}
            onPress={() => onChange(look)}
            disabled={off}
            accessibilityRole='radio'
            accessibilityState={{ checked: chosen, disabled: off }}
            accessibilityLabel={off ? `${name}, a friend flies it` : name}
          >
            <View style={[s.ring, chosen && s.chosen]}>
              <FlockBadge look={look} size={LookSizes.BADGE} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: space.sm,
    marginBottom: space.sm,
  },
  // A quarter of the row each, so four sit across whatever the width.
  cell: { width: '25%', alignItems: 'center' },
  ring: {
    width: LookSizes.BADGE + (LookSizes.RING + LookSizes.INSET) * 2,
    height: LookSizes.BADGE + (LookSizes.RING + LookSizes.INSET) * 2,
    borderRadius:
      (LookSizes.BADGE + (LookSizes.RING + LookSizes.INSET) * 2) / 2,
    borderWidth: LookSizes.RING,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chosen: { borderColor: colors.coral },
  off: { opacity: 0.35 },
});
