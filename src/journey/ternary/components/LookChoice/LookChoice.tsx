import React from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@shared/theme';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { LookCell } from './components/LookCell/LookCell';

const LOOKS = Array.from({ length: TernaryRules.LOOKS }, (_, look) => look);

/**
 * Choosing the bird you fly as in a ternary: each pose in its own colour, as it flies on the
 * map, in two rows of four. Birds a friend already flies (`taken`) can't be chosen.
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
      {LOOKS.map((look) => (
        <LookCell
          key={look}
          look={look}
          chosen={look === value}
          off={Boolean(taken?.has(look)) && look !== value}
          onChoose={() => onChange(look)}
        />
      ))}
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
});
