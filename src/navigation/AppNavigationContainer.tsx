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
import { useJoinLinkNavigation } from './useJoinLinkNavigation';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.card,
    border: colors.border,
  },
};

/** Restores the place after a remount, except while the wizard is pending (it'd be skipped). */
export function AppNavigationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const nav = useNavigationContainerRef<RootStackParamList>();
  const [mounted, setMounted] = useState(false);
  useNotificationNavigation(nav, mounted && settings.onboarding.wizardDone);
  useJoinLinkNavigation(nav, mounted && settings.onboarding.wizardDone);
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
