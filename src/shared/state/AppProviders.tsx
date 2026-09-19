import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@shared/theme';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { FoodProvider, useFood } from '@food/FoodContext';
import { WeightProvider, useWeight } from '@weight/WeightContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';

/**
 * Composition root for all app-wide state. Each domain owns its own
 * context (see the sibling *Context.tsx files) so a change in one — e.g.
 * toggling a Settings switch — doesn't re-render screens that only read
 * another domain. WaypointsProvider must nest inside FoodProvider: it
 * reads foodLog to keep the "logging all meals" bonus honest. Every
 * provider reads its data through the repositories in BackendContext, so
 * this must render inside a BackendProvider (see AuthGate).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <FoodProvider>
        <WeightProvider>
          <WaypointsProvider>
            <LoadGate>{children}</LoadGate>
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
