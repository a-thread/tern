import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

/** Wraps icon and label in a measurable view so tips spotlight them, not the whole button. */
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
