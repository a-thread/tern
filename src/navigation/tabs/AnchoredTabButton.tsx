import React, { useState } from 'react';
import { Platform, StyleSheet, View, type HostInstance } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { colors } from '@shared/theme';

// Android's borderless ripple grows with the button, which is huge on tablets and foldables;
// a flat tint that fills the tab item reads the same at every width.
const tintOnPress = Platform.OS === 'android';

/** Wraps icon and label in a measurable view so tips spotlight them, not the whole button. */
export function AnchoredTabButton({
  anchor,
  children,
  onPressIn,
  onPressOut,
  style,
  ...props
}: BottomTabBarButtonProps & { anchor: React.RefObject<HostInstance | null> }) {
  const [pressed, setPressed] = useState(false);
  return (
    <PlatformPressable
      {...props}
      pressColor={tintOnPress ? 'transparent' : props.pressColor}
      onPressIn={(e) => {
        if (tintOnPress) setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (tintOnPress) setPressed(false);
        onPressOut?.(e);
      }}
      style={[style, pressed && s.pressed]}
    >
      <View ref={anchor} collapsable={false} style={s.content}>
        {children}
      </View>
    </PlatformPressable>
  );
}

const s = StyleSheet.create({
  content: { alignItems: 'center' },
  pressed: { backgroundColor: colors.doveTint },
});
