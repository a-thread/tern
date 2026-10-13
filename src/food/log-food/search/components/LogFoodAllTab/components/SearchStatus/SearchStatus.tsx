import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';

/**
 * One quiet line when a source couldn't be reached. What else was found stays
 * on screen above it; loading itself is shown by the search bar, so nothing
 * here appears or disappears while a search runs.
 */
export function SearchStatus({
  failedLabels,
  failedAll,
  anyResults,
  onRetry,
}: {
  failedLabels: string[];
  failedAll: boolean;
  anyResults: boolean;
  onRetry: () => void;
}) {
  if (!failedLabels.length) return null;
  const text =
    failedAll && !anyResults
      ? "Couldn't reach the food databases. Check your connection, or create the food below."
      : `Couldn't load ${failedLabels.join(' or ')}.`;
  return (
    <View style={s.note}>
      <Text style={s.text}>{text}</Text>
      <Pressable onPress={onRetry} hitSlop={8} accessibilityRole='button'>
        <Text style={s.retry}>Try again</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingTop: space.md,
  },
  text: { flex: 1, fontFamily: font.body, fontSize: 12, lineHeight: 17, color: colors.ink2 },
  retry: { fontFamily: font.semibold, fontSize: 12.5, color: colors.coral },
});
