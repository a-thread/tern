import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  useFonts,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import { colors } from '@shared/theme';
import { AppProviders } from '@shared/state/AppProviders';
import RootNavigator from '@shared/navigation/RootNavigator';
import AuthGate from '@shared/auth/AuthGate';
import { ToastProvider } from '@shared/state/ToastContext';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.card,
    border: colors.border,
  },
};

export default function App() {
  const [loaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style='dark' />
      <ToastProvider>
        <AuthGate>
          <AppProviders>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
          </AppProviders>
        </AuthGate>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
