import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import {
  planName,
  type PlanOption,
  priceLabel,
} from '@/domain/subscription/models/subscription';

/** One plan to pick on the paywall: its name and price, marked when chosen. */
export function PlanChoice({
  option,
  chosen,
  onChoose,
}: {
  option: PlanOption;
  chosen: boolean;
  onChoose: () => void;
}) {
  const name = planName(option.plan);
  const price = priceLabel(option);
  return (
    <Pressable
      style={[s.row, chosen && s.chosen]}
      onPress={onChoose}
      accessibilityRole='radio'
      accessibilityState={{ checked: chosen }}
      accessibilityLabel={`${name}, ${price}`}
    >
      <View style={[s.dot, chosen && s.dotChosen]} />
      <Text style={[typography.rowTitle, { flex: 1 }]}>{name}</Text>
      <Text style={typography.meta}>{price}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    marginBottom: space.sm,
  },
  chosen: { borderColor: colors.coral },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.dove,
  },
  dotChosen: { borderColor: colors.coral, borderWidth: 5 },
});
