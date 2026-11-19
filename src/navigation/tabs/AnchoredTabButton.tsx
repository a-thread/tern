import React, { useState } from 'react';
import { StyleSheet, View, type HostInstance } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { TabPressedContext } from './TabPill';

/** Wraps icon and label in a measurable view so tips spotlight them, not the whole button. */
export function AnchoredTabButton({
  anchor,
  children,
  onPressIn,
  onPressOut,
  ...props
}: BottomTabBarButtonProps & { anchor: React.RefObject<HostInstance | null> }) {
  const [pressed, setPressed] = useState(false);
  return (
    <PlatformPressable
      {...props}
      // The pill behind the icon shows the press, so no ripple across the whole button.
      pressColor='transparent'
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
    >
      <TabPressedContext.Provider value={pressed}>
        <View ref={anchor} collapsable={false} style={s.content}>
          {children}
        </View>
      </TabPressedContext.Provider>
    </PlatformPressable>
  );
}

const s = StyleSheet.create({ content: { alignItems: 'center' } });
