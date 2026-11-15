import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';

/** One amount in the tip jar, shown as a fish that grows with the tip. */
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
  return (
    <Pressable
      style={[s.tile, disabled && s.waiting]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={`Tip ${price}: a ${fish}`}
      accessibilityState={{ busy, disabled }}
    >
      <Icon name='fish' size={fishSize} color={colors.sunDeep} />
      <Text style={typography.caption}>A {fish}</Text>
      <Text style={typography.heading}>{price}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
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
