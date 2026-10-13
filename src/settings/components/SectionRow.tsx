import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IconBadge, Row } from '@shared/components/ui';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** A row on the Settings index: a tinted icon, the section's name, a one-line summary, and a chevron. */
export function SectionRow({
  icon,
  color,
  tint,
  title,
  summary,
  onPress,
}: {
  icon: IconName;
  /** The icon's colour, and the paler `tint` behind it. */
  color: string;
  tint: string;
  title: string;
  summary?: string;
  onPress: () => void;
}) {
  return (
    <Row
      title={title}
      sub={summary}
      icon={
        <IconBadge bg={tint}>
          <MaterialCommunityIcons name={icon} size={17} color={color} />
        </IconBadge>
      }
      chevron
      onPress={onPress}
    />
  );
}
