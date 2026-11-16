import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, font } from '@shared/theme';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';

/**
 * Words inside a sentence that open Ternary settings, where the thing they name is turned
 * on. Only someone in a ternary has those settings, so for anyone else it's plain words.
 */
export function SettingsLink({ children }: { children: string }) {
  const { ternary } = useTernary();
  const navigation = useTernaryNavigation();
  if (!ternary) return <>{children}</>;
  return (
    <Text
      style={s.link}
      onPress={() => navigation.navigate('TernarySettings')}
      accessibilityRole='link'
      accessibilityHint='Opens Ternary settings'
      suppressHighlighting
    >
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  // As a Row's `subLink`: the app's link colour, a little heavier than the words around it.
  link: { fontFamily: font.semibold, color: colors.water },
});
