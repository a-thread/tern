import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

/**
 * The navigator's own tab button, with its icon and label in a view the tips on Today can
 * measure: the spotlight hugs the two of them in the middle of the tab, not the whole
 * quarter-width button (which runs to the screen's edge) or the icon alone (which cuts the
 * label in half). The view keeps the button's own layout, a centred column, since the app is
 * portrait only.
 */
export function AnchoredTabButton({
  anchor,
  children,
  ...props
}: BottomTabBarButtonProps & { anchor: React.RefObject<View | null> }) {
  return (
    <PlatformPressable {...props}>
      <View ref={anchor} collapsable={false} style={s.content}>
        {children}
      </View>
    </PlatformPressable>
  );
}

const s = StyleSheet.create({ content: { alignItems: 'center' } });
