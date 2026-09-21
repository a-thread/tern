import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@shared/theme';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { FoodProvider, useFood } from '@food/FoodContext';
import { SavedMealsProvider } from '@food/SavedMealsContext';
import { WeightProvider, useWeight } from '@weight/WeightContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { ActivityProvider, useActivity } from '@today/ActivityContext';
import { MedicationProvider, useMedication } from '@medication/MedicationContext';
import { WaterProvider, useWater } from '@water/WaterContext';
import { RemindersSync } from '@settings/RemindersSync';
import { DayKeyProvider } from '@shared/hooks/useDayKey';

/** App-wide providers, rendered inside BackendProvider by AuthGate. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <DayKeyProvider>
    <SettingsProvider>
      <FoodProvider>
        <SavedMealsProvider>
          <WeightProvider>
            <MedicationProvider>
              <WaypointsProvider>
                <WaterProvider>
                  <ActivityProvider>
                    <LoadGate>{children}</LoadGate>
                    <RemindersSync />
                  </ActivityProvider>
                </WaterProvider>
              </WaypointsProvider>
            </MedicationProvider>
          </WeightProvider>
        </SavedMealsProvider>
      </FoodProvider>
    </SettingsProvider>
    </DayKeyProvider>
  );
}

/** Holds the UI back until every domain has loaded, so no screen flashes defaults or zeros. */
function LoadGate({ children }: { children: React.ReactNode }) {
  const ready = [
    useSettings().ready,
    useFood().ready,
    useWeight().ready,
    useMedication().ready,
    useWater().ready,
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
