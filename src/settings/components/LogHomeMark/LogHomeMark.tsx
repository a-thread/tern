import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@shared/theme';
import { IconBadge } from '@shared/components/ui';
import { LogHome } from '../../models/logHome';

/**
 * Where the log lives, as the Tern Plus row's icon: a phone with a check while it's kept on
 * this phone, a cloud with a check once it's synced to Tern Plus. Warm driftwood against
 * cool deep water, so the two differ by colour as well as shape, on pale tints that keep
 * the icons legible. The row's text says the same thing, so it stays out of the screen
 * reader's way.
 */
export function LogHomeMark({ home }: { home: LogHome }) {
  const synced = home === LogHome.Account;
  return (
    <View importantForAccessibility='no-hide-descendants' accessibilityElementsHidden>
      <IconBadge bg={synced ? colors.waterTint : colors.driftwoodTint}>
        <MaterialCommunityIcons
          // Both outlines, so they read as a pair: the phone glyph is already drawn as one.
          name={synced ? 'cloud-check-outline' : 'cellphone-check'}
          size={17}
          color={synced ? colors.water : colors.driftwood}
        />
      </IconBadge>
    </View>
  );
}
