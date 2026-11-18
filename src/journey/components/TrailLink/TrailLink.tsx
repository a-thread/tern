import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { TRAIL_PALETTE } from '@shared/models/trailPalette';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { trailFor } from '@/domain/settings/models/trailColor';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/** Supporters only. */
export function TrailLink() {
  const { supporter } = useSubscription();
  const { settings } = useSettings();
  const navigation = useRootNavigation();
  if (!supporter) return null;

  return (
    <Pressable
      style={s.link}
      onPress={() => navigation.navigate('Trail')}
      hitSlop={8}
      accessibilityRole='button'
      accessibilityLabel='Choose your trail color'
    >
      <View
        style={[
          s.stroke,
          {
            backgroundColor:
              TRAIL_PALETTE[trailFor(settings.trailColor, supporter)],
          },
        ]}
      />
      <Text style={s.text}>Choose your trail color</Text>
      <Icon name='chevron-right' size={14} color={colors.onDarkSoft} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.chipOnDark,
  },
  stroke: {
    width: 14,
    height: 3,
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
  text: { ...typography.meta, color: colors.onDarkSoft },
});
