import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, tierTextColors, typography } from '../theme';

/** NOVA processing tier. Shows the number by default — not color alone — for a11y; user-togglable in Settings. */
export function TierDot({
  tier,
  color,
  showNumber = true,
}: {
  tier: number;
  color: string;
  showNumber?: boolean;
}) {
  return (
    <View style={[s.tier, { backgroundColor: color }]}>
      {showNumber ? (
        <Text
          style={[
            s.tierText,
            {
              color: tierTextColors[tier as 1 | 2 | 3 | 4] ?? colors.onAction,
            },
          ]}
        >
          {tier}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  tier: {
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontFamily: font.bold,
    fontSize: typography.small.fontSize,
  },
});
