import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { type RouteId, Routes } from '@/domain/waypoints/models/routes';

/**
 * Which tracked migration a new ternary's shared bird flies, as a pair of choices with what
 * makes each one its own. Chosen once, when the ternary is started.
 */
export function RouteChoice({
  value,
  onChange,
}: {
  value: RouteId;
  onChange: (route: RouteId) => void;
}) {
  return (
    <View accessibilityRole='radiogroup' style={s.list}>
      {Routes.ALL.map((route) => {
        const chosen = route.id === value;
        return (
          <Pressable
            key={route.id}
            style={[s.row, chosen && s.chosen]}
            onPress={() => onChange(route.id)}
            accessibilityRole='radio'
            accessibilityState={{ checked: chosen }}
            accessibilityLabel={`${route.name}. ${route.summary}`}
          >
            <View style={[s.dot, chosen && s.dotChosen]} />
            <View style={s.text}>
              <Text style={typography.rowTitle}>{route.name}</Text>
              <Text style={s.summary}>{route.summary}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: space.sm, marginBottom: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.md,
  },
  chosen: { borderColor: colors.coral },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.controlOff,
  },
  dotChosen: { borderColor: colors.coral, borderWidth: 5 },
  text: { flex: 1, gap: 2 },
  summary: { ...typography.caption, lineHeight: 16 },
});
