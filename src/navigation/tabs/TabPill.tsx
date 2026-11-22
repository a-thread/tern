import React, { createContext, useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@shared/theme';

// Optional on purpose: outside a tab button nothing is being pressed.
export const TabPressedContext = createContext(false);

/** A capsule behind a tab's icon: coral on the current tab, grey while another is pressed. */
export function TabPill({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const pressed = useContext(TabPressedContext);
  return (
    <View style={s.pill}>
      {/* Always mounted with its color, only faded in: Android squares the corners of a
          background that first appears on a view that's already shown. */}
      <View
        style={[
          s.fill,
          focused ? s.selected : s.pressed,
          { opacity: focused || pressed ? 1 : 0 },
        ]}
      />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  // Wider than the icon slot it sits in; the slot centres it and lets it overflow.
  pill: {
    width: 56,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { ...StyleSheet.absoluteFill, borderRadius: radius.pill },
  selected: { backgroundColor: colors.coralTint },
  pressed: { backgroundColor: colors.track },
});
