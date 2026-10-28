import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@shared/components/LoadingScreen/LoadingScreen';

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

import { AppProviders } from '@/AppProviders';
import RootNavigator from '@/navigation/RootNavigator';
import { AppNavigationContainer } from '@/navigation/AppNavigationContainer';
import AuthGate from '@/AuthGate';
import { ToastProvider } from '@shared/state/ToastContext';

enableFreeze(true);

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
      <LoadingScreen />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style='dark' />
      <ToastProvider>
        <AuthGate>
          <AppProviders>
            <AppNavigationContainer>
              <RootNavigator />
            </AppNavigationContainer>
          </AppProviders>
        </AuthGate>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
