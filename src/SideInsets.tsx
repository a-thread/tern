import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@shared/theme';

/**
 * Keeps every screen clear of a side cutout or side navigation bar (Android phones in landscape).
 * The inner provider measures from inside the padding, so screens see no side insets and don't pad twice.
 */
export function SideInsets({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['left', 'right']} style={s.root}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
});
