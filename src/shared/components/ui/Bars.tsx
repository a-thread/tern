import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme';

export function ProgressBar({
  value,
  color,
  track = colors.doveTint,
  height = 6,
}: {
  value: number;
  color: string;
  track?: string;
  height?: number;
}) {
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: track,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${Math.min(Math.max(value, 0), 1) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
