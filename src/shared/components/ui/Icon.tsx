import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@shared/theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * An icon from Material Community Icons (https://pictogrammers.com/library/mdi/), the one icon
 * set the app uses. Decorative by default: give it an `accessibilityLabel` only when the icon
 * stands alone, with no text beside it saying the same thing.
 */
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
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
