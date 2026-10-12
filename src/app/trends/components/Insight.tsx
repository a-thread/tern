import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, font, radius, space } from '../../shared/theme';

/** A short note under a chart, with an optional icon. */
export function Insight({
  children,
  bg = colors.auroraTint,
  icon,
}: {
  children: string;
  bg?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={[s.insight, { backgroundColor: bg }]}>
      {icon ? <View style={s.icon}>{icon}</View> : null}
      <Text style={s.text}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  insight: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    marginTop: space.md,
  },
  icon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
  },
});
