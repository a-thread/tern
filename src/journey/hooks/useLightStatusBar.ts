import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';

/**
 * Light status bar text while the screen is focused, for a screen whose top is a dark sky. Tabs stay
 * mounted, so this follows focus rather than rendering a `<StatusBar>`, and hands back the app's dark one on blur.
 */
export function useLightStatusBar() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );
}
