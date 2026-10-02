import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { font } from '@shared/theme';

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
      {showNumber ? <Text style={s.tierText}>{tier}</Text> : null}
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
  tierText: { fontFamily: font.bold, fontSize: 9.5, color: '#fff' },
});
