import React from 'react';
import LoadingScreen from '@shared/components/LoadingScreen';
import { DayKeyProvider } from '@shared/hooks/useDayKey';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { RemindersSync } from '@settings/components/RemindersSync';
import { FoodProvider, useFood } from '@food/FoodContext';
import { SavedMealsProvider } from '@food/SavedMealsContext';
import { CommonFoodsProvider } from '@food/CommonFoodsContext';
import { WeightProvider, useWeight } from '@weight/WeightContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { ActivityProvider, useActivity } from '@today/ActivityContext';
import { MedicationProvider, useMedication } from '@medication/MedicationContext';
import { WaterProvider, useWater } from '@water/WaterContext';
import { MoodProvider, useMood } from '@mood/MoodContext';
import { MovementProvider, useMovement } from '@movement/MovementContext';
import { useBackend, type Backend } from './BackendContext';
import { assertProviderOrder, type ProviderSpec } from './providerOrder';

type Entry = ProviderSpec & {
  wrap: (children: React.ReactNode, backend: Backend) => React.ReactNode;
};

/**
 * Every provider, outermost first, with the ones above it that it reads from. Add a provider
 * here and say what it needs; the order is checked once, when the app starts.
 */
const PROVIDERS: readonly Entry[] = [
  {
    name: 'settings',
    needs: [],
    wrap: (c, b) => <SettingsProvider repo={b.settings}>{c}</SettingsProvider>,
  },
  {
    name: 'waypoints',
    needs: [],
    wrap: (c, b) => <WaypointsProvider repo={b.waypoints}>{c}</WaypointsProvider>,
  },
  {
    name: 'food',
    needs: ['waypoints'],
    wrap: (c, b) => <FoodProvider repo={b.food}>{c}</FoodProvider>,
  },
  {
    name: 'savedMeals',
    needs: [],
    wrap: (c, b) => <SavedMealsProvider repo={b.savedMeals}>{c}</SavedMealsProvider>,
  },
  {
    // Not in LoadGate: search works without it until the list arrives.
    name: 'commonFoods',
    needs: [],
    wrap: (c, b) => <CommonFoodsProvider repo={b.commonFoods}>{c}</CommonFoodsProvider>,
  },
  {
    name: 'weight',
    needs: ['settings', 'waypoints'],
    wrap: (c, b) => <WeightProvider repo={b.weight}>{c}</WeightProvider>,
  },
  {
    name: 'medication',
    needs: ['settings', 'waypoints'],
    wrap: (c, b) => <MedicationProvider repo={b.medication}>{c}</MedicationProvider>,
  },
  {
    name: 'water',
    needs: ['settings', 'waypoints'],
    wrap: (c, b) => <WaterProvider repo={b.water}>{c}</WaterProvider>,
  },
  {
    name: 'mood',
    needs: ['settings', 'waypoints'],
    wrap: (c, b) => <MoodProvider repo={b.mood}>{c}</MoodProvider>,
  },
  {
    name: 'movement',
    needs: ['settings', 'waypoints'],
    wrap: (c, b) => (
      <MovementProvider repo={b.movement} workouts={b.workouts}>
        {c}
      </MovementProvider>
    ),
  },
  {
    name: 'activity',
    needs: ['settings', 'waypoints', 'movement'],
    wrap: (c, b) => (
      <ActivityProvider steps={b.steps} restDays={b.restDays}>
        {c}
      </ActivityProvider>
    ),
  },
];

assertProviderOrder(PROVIDERS);

/** App-wide providers, rendered inside BackendProvider by AuthGate. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const backend = useBackend();
  const inner = (
    <>
      <LoadGate>{children}</LoadGate>
      <RemindersSync />
    </>
  );
  const tree = PROVIDERS.reduceRight<React.ReactNode>((child, p) => p.wrap(child, backend), inner);
  return <DayKeyProvider>{tree}</DayKeyProvider>;
}

/** Holds the UI back until every domain has loaded, so no screen flashes defaults or zeros. */
function LoadGate({ children }: { children: React.ReactNode }) {
  const ready = [
    useSettings().ready,
    useFood().ready,
    useWeight().ready,
    useMedication().ready,
    useWater().ready,
    useMood().ready,
    useMovement().ready,
    useWaypoints().ready,
    useActivity().ready,
  ].every(Boolean);

  if (!ready) {
    return (
      <LoadingScreen />
    );
  }
  return <>{children}</>;
}
