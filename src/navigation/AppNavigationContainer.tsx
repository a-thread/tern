import React, { useState } from 'react';
import {
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';

import { colors } from '@shared/theme';
import { useSettings } from '../domain/settings/SettingsContext';
import { lastNavigation, rememberNavigation } from './navigationMemory';
import type { RootStackParamList } from './types';
import { useNotificationNavigation } from './useNotificationNavigation';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.card,
    border: colors.border,
  },
};

/**
 * The app's navigation, picking up where it was after a remount (sign-in, a change of
 * account, erasing or restoring data). While the setup wizard is still to do, it starts
 * there instead: a remembered place in the app would skip it, since the wizard's route
 * isn't in that state. A tapped notification opens what it asked for once the wizard is done.
 */
export function AppNavigationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const nav = useNavigationContainerRef<RootStackParamList>();
  const [mounted, setMounted] = useState(false);
  useNotificationNavigation(nav, mounted && settings.onboarding.wizardDone);
  return (
    <NavigationContainer
      ref={nav}
      theme={navTheme}
      initialState={
        settings.onboarding.wizardDone ? lastNavigation() : undefined
      }
      onReady={() => setMounted(true)}
      onStateChange={rememberNavigation}
    >
      {children}
    </NavigationContainer>
  );
}
