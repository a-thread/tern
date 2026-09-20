import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@shared/theme';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { FoodProvider, useFood } from '@food/FoodContext';
import { WeightProvider, useWeight } from '@weight/WeightContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { ActivityProvider, useActivity } from '@today/ActivityContext';
import { RemindersSync } from '@settings/RemindersSync';

/** App-wide providers, rendered inside BackendProvider by AuthGate. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <FoodProvider>
        <WeightProvider>
          <WaypointsProvider>
            <ActivityProvider>
              <LoadGate>{children}</LoadGate>
              <RemindersSync />
            </ActivityProvider>
          </WaypointsProvider>
        </WeightProvider>
      </FoodProvider>
    </SettingsProvider>
  );
}

/** Holds the UI back until every domain has loaded, so no screen flashes defaults or zeros. */
function LoadGate({ children }: { children: React.ReactNode }) {
  const ready = [
    useSettings().ready,
    useFood().ready,
    useWeight().ready,
    useWaypoints().ready,
    useActivity().ready,
  ].every(Boolean);

  if (!ready) {
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
  return <>{children}</>;
}
