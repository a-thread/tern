import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme';

export type IconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

/** Material Community Icons. Decorative unless given an `accessibilityLabel` (only when it stands alone). */
export function Icon({
  name,
  size = 16,
  color = colors.ink2,
  accessibilityLabel,
}: {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel ? 'yes' : 'no-hide-descendants'
      }
    />
  );
}
