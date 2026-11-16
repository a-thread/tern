import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { FlockLooks } from '../../../models/flockLooks';
import { FlockBadge } from '../FlockBadge/FlockBadge';

const LOOKS = Array.from({ length: TernaryRules.LOOKS }, (_, look) => look);

/**
 * Choosing the bird you fly as in a ternary: each pose in its own colour, as it flies on the
 * map. Birds a friend already flies (`taken`) can't be chosen.
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
            style={[s.tile, chosen && s.chosen, off && s.off]}
            onPress={() => onChange(look)}
            disabled={off}
            accessibilityRole='radio'
            accessibilityState={{ checked: chosen, disabled: off }}
            accessibilityLabel={off ? `${name}, a friend flies it` : name}
          >
            <FlockBadge look={look} size={40} />
            <Text style={s.name} numberOfLines={1}>
              {off ? 'Taken' : FlockLooks.NAMES[look]}
            </Text>
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
    gap: space.sm,
    marginBottom: space.md,
  },
  tile: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  chosen: { borderColor: colors.coral },
  off: { opacity: 0.45 },
  name: typography.caption,
});
