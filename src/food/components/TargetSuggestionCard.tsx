import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { GroupLabel } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { useAdaptiveTarget } from '@food/hooks/useAdaptiveTarget';

/**
 * The adaptive target's weekly suggestion, on Today. Shows only when there is
 * one worth making and it hasn't been answered this week; nothing changes
 * until "Use" is tapped.
 */
export function TargetSuggestionCard() {
  const { settings } = useSettings();
  const adaptive = useAdaptiveTarget();
  const e = adaptive.estimate;
  if (!adaptive.offer || adaptive.suggestion === null || e?.status !== 'ready') return null;

  return (
    <>
      <GroupLabel>Your calorie target</GroupLabel>
      <View style={s.card}>
        <Text style={s.title}>
          {`Your target could be ${adaptive.suggestion.toLocaleString()} (from ${settings.calorieTarget.toLocaleString()})`}
        </Text>
        <Text style={s.sub}>
          {`You've been burning about ${e.kcal.toLocaleString()} a day, from what you logged and your weight trend.`}
        </Text>
        <View style={s.actions}>
          <Pressable style={s.use} onPress={adaptive.apply} accessibilityRole='button'>
            <Text style={s.useText}>{`Use ${adaptive.suggestion.toLocaleString()}`}</Text>
          </Pressable>
          <Pressable onPress={adaptive.dismiss} hitSlop={8} accessibilityRole='button'>
            <Text style={s.notNow}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md + 1 },
  title: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 12, lineHeight: 17, color: colors.ink2, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  use: { backgroundColor: colors.coral, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  useText: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  notNow: { fontFamily: font.medium, fontSize: 13, color: colors.ink2 },
});
