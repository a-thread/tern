import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@shared/theme';
import { IconBadge } from '@shared/components/ui';
import { LogHome } from '../../models/logHome';

/**
 * Where the data lives: a phone with a check while it's kept on this phone, a cloud with a
 * check once it's synced to Tern Plus. Warm driftwood against cool deep water, so the two
 * differ by colour as well as shape, on pale tints that keep the icons legible.
 *
 * `corner` is the ringed mark on the profile avatar, and says where to a screen reader.
 * `badge` is a row icon beside text that already says it, so it stays out of the way.
 */
export function LogHomeMark({
  home,
  variant,
}: {
  home: LogHome;
  variant: 'corner' | 'badge';
}) {
  const synced = home === LogHome.Account;
  const tint = synced ? colors.waterTint : colors.driftwoodTint;
  const glyph = (
    <MaterialCommunityIcons
      // Both outlines, so they read as a pair: the phone glyph is already drawn as one.
      name={synced ? 'cloud-check-outline' : 'cellphone-check'}
      size={variant === 'corner' ? 13 : 17}
      color={synced ? colors.water : colors.driftwood}
    />
  );

  if (variant === 'badge') {
    return (
      <View importantForAccessibility='no-hide-descendants' accessibilityElementsHidden>
        <IconBadge bg={tint}>{glyph}</IconBadge>
      </View>
    );
  }
  return (
    <View
      style={[s.corner, { backgroundColor: tint }]}
      accessible
      accessibilityRole='image'
      accessibilityLabel={synced ? 'Synced to your account' : 'Kept on this phone'}
    >
      {glyph}
    </View>
  );
}

const s = StyleSheet.create({
  // Ringed in the card's color so it reads as a mark on the avatar, not part of it.
  corner: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
