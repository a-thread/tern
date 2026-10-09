import React from 'react';
import { Icon } from './Icon';
import { colors } from '@shared/theme';

export function Chevron({ color = colors.ink3 }: { color?: string }) {
  return (
    <Icon name='chevron-right' size={17} color={color} />
  );
}
