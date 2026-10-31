import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';

import { colors } from '@shared/theme';
import { useSettings } from '../domain/settings/SettingsContext';
import { lastNavigation, rememberNavigation } from './navigationMemory';

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
 * isn't in that state.
 */
export function AppNavigationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  return (
    <NavigationContainer
      theme={navTheme}
      initialState={
        settings.onboarding.wizardDone ? lastNavigation() : undefined
      }
      onStateChange={rememberNavigation}
    >
      {children}
    </NavigationContainer>
  );
}
