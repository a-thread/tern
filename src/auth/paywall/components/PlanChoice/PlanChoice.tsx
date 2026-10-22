import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';
import {
  planName,
  type PlanOption,
  priceLabel,
} from '@/domain/subscription/models/subscription';

/**
 * One plan to pick on the paywall: its name and price, marked when chosen. `note` is a
 * small badge beside the name, such as what the yearly plan saves.
 */
export function PlanChoice({
  option,
  chosen,
  note,
  onChoose,
}: {
  option: PlanOption;
  chosen: boolean;
  note?: string;
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
      accessibilityLabel={[name, price, note].filter(Boolean).join(', ')}
    >
      <View style={[s.dot, chosen && s.dotChosen]} />
      <View style={s.name}>
        <Text style={typography.rowTitle}>{name}</Text>
        {note ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{note}</Text>
          </View>
        ) : null}
      </View>
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
  name: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  // Gold, the color for goal moments: coral stays the action.
  badge: {
    backgroundColor: colors.sunTint,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: font.semibold, fontSize: 11, color: colors.sunDeep },
});
