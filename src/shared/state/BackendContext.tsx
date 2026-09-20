import React, { createContext, useContext } from 'react';
import { supabase } from '@shared/backend/supabase';
import {
  createMemoryFoodRepository,
  type FoodRepository,
} from '@food/repository';
import { createSupabaseFoodRepository } from '@food/repository.supabase';
import {
  createMemoryWeightRepository,
  type WeightRepository,
} from '@weight/repository';
import { createSupabaseWeightRepository } from '@weight/repository.supabase';
import {
  createMemorySettingsRepository,
  type SettingsRepository,
} from '@settings/repository';
import { createSupabaseSettingsRepository } from '@settings/repository.supabase';
import {
  createMemoryWaypointsRepository,
  type WaypointsRepository,
} from '@journey/repository';
import { createSupabaseWaypointsRepository } from '@journey/repository.supabase';
import {
  createMemoryStepsRepository,
  createUnavailableStepsRepository,
  type StepsRepository,
} from '@today/steps.repository';
import { createHealthConnectStepsRepository } from '@today/steps.healthconnect';
import {
  createMemoryRestDaysRepository,
  type RestDaysRepository,
} from '@today/restDays.repository';
import { createSupabaseRestDaysRepository } from '@today/restDays.repository.supabase';
import type { DataRepository } from './dataRepository';
import { createSupabaseDataRepository } from './dataRepository.supabase';

/** Every repository the app persists through. Contexts read these; they never touch Supabase directly. */
export type Backend = {
  food: FoodRepository;
  weight: WeightRepository;
  settings: SettingsRepository;
  waypoints: WaypointsRepository;
  steps: StepsRepository;
  restDays: RestDaysRepository;
  /** Export and erase, for signed-in accounts. Absent in local mode, where nothing is stored. */
  data?: DataRepository;
};

/** Local mock data — used when no Supabase keys are configured, and in tests. */
export function createMemoryBackend(): Backend {
  return {
    food: createMemoryFoodRepository(),
    weight: createMemoryWeightRepository(),
    settings: createMemorySettingsRepository(),
    waypoints: createMemoryWaypointsRepository(),
    steps: createMemoryStepsRepository(),
    restDays: createMemoryRestDaysRepository(),
  };
}

/** Repositories bound to the signed-in user's Supabase session. */
export function createRemoteBackend(): Backend {
  if (!supabase) throw new Error('Supabase is not configured');
  return {
    food: createSupabaseFoodRepository(supabase),
    weight: createSupabaseWeightRepository(supabase),
    settings: createSupabaseSettingsRepository(supabase),
    waypoints: createSupabaseWaypointsRepository(supabase),
    // Real steps only. With no step source the count stays at zero — mock
    // steps would earn a real account waypoints it didn't earn.
    steps:
      createHealthConnectStepsRepository() ??
      createUnavailableStepsRepository(),
    restDays: createSupabaseRestDaysRepository(supabase),
    data: createSupabaseDataRepository(supabase),
  };
}

const BackendContext = createContext<Backend | null>(null);

export function BackendProvider({
  backend,
  children,
}: {
  backend: Backend;
  children: React.ReactNode;
}) {
  return (
    <BackendContext.Provider value={backend}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackend must be used within BackendProvider');
  return ctx;
}
