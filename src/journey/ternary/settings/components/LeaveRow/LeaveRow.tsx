import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';

/** Leaving the ternary, set apart in red since it can't be undone. */
export function LeaveRow({
  name,
  alone,
  onPress,
}: {
  name: string;
  /** You're its only member, so leaving deletes it. */
  alone: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.pressed]}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityHint={
        alone ? 'Deletes the ternary, since you’re its only member' : undefined
      }
    >
      <Icon name='exit-run' size={20} color={colors.danger} />
      <View style={s.words}>
        <Text style={s.title}>
          {alone ? `Leave and delete ${name}` : `Leave ${name}`}
        </Text>
        <Text style={s.sub}>
          {alone
            ? 'You’re the only one in it. You keep your waypoints.'
            : 'You keep every waypoint you’ve earned'}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.7 },
  words: { flex: 1, gap: 2 },
  title: { ...typography.rowTitle, color: colors.danger },
  sub: { ...typography.caption, lineHeight: 16 },
});
