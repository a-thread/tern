import React, { useMemo, useState } from 'react';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { supabase } from '@shared/backend/supabase';
import {
  createMemoryFoodRepository,
  type FoodRepository,
} from './domain/food/food.repository';
import { createSupabaseFoodRepository } from './domain/food/food.repository.supabase';
import {
  createMemoryWeightRepository,
  type WeightRepository,
} from './domain/weight/weight.repository';
import { createSupabaseWeightRepository } from './domain/weight/weight.repository.supabase';
import {
  createMemorySettingsRepository,
  type SettingsRepository,
} from './domain/settings/settings.repository';
import { createSupabaseSettingsRepository } from './domain/settings/settings.repository.supabase';
import {
  createMemoryWaypointsRepository,
  type WaypointsRepository,
} from './domain/waypoints/waypoints.repository';
import { createSupabaseWaypointsRepository } from './domain/waypoints/waypoints.repository.supabase';
import {
  createMemoryStepsRepository,
  createUnavailableStepsRepository,
  type StepsRepository,
} from './domain/activity/steps.repository';
import { createHealthStepsRepository } from './domain/activity/steps.health';
import { sampleSteps } from './domain/activity/sampleSteps';
import {
  createMemoryRestDaysRepository,
  type RestDaysRepository,
} from './domain/activity/restDays.repository';
import { createSupabaseRestDaysRepository } from './domain/activity/restDays.repository.supabase';
import {
  createMemorySavedMealsRepository,
  type SavedMealsRepository,
} from './domain/saved-meals/savedMeals.repository';
import { createSupabaseSavedMealsRepository } from './domain/saved-meals/savedMeals.repository.supabase';
import {
  createMemoryMedicationRepository,
  type MedicationRepository,
} from './domain/medication/medication.repository';
import { createSupabaseMedicationRepository } from './domain/medication/medication.repository.supabase';
import {
  createMemoryWaterRepository,
  type WaterRepository,
} from './domain/water/water.repository';
import { createSupabaseWaterRepository } from './domain/water/water.repository.supabase';
import {
  createMemoryMoodRepository,
  type MoodRepository,
} from './domain/mood/mood.repository';
import { createSupabaseMoodRepository } from './domain/mood/mood.repository.supabase';
import {
  createMemoryMealCheckInsRepository,
  type MealCheckInsRepository,
} from './domain/meal-check-ins/mealCheckIns.repository';
import { createSupabaseMealCheckInsRepository } from './domain/meal-check-ins/mealCheckIns.repository.supabase';
import {
  createMemoryCommonFoodsRepository,
  type CommonFoodsRepository,
} from './domain/common-foods/commonFoods.repository';
import { createSupabaseCommonFoodsRepository } from './domain/common-foods/commonFoods.repository.supabase';
import {
  createMemoryMovementRepository,
  type MovementRepository,
} from './domain/movement/movement.repository';
import { createSupabaseMovementRepository } from './domain/movement/movement.repository.supabase';
import type { WorkoutsSource } from './domain/movement/movement.healthconnect';
import { createHealthWorkouts } from './domain/movement/movement.health';
import type { DataRepository } from './domain/settings/dataRepository';
import { createSupabaseDataRepository } from './domain/settings/dataRepository.supabase';
import type { LocalDb } from '@shared/backend/localDb';
import {
  type AppSettings,
  phoneSettings,
} from './domain/settings/models/appSettings';
import { createLocalFoodRepository } from './domain/food/food.repository.local';
import { createLocalWeightRepository } from './domain/weight/weight.repository.local';
import { createLocalSettingsRepository } from './domain/settings/settings.repository.local';
import { createLocalWaypointsRepository } from './domain/waypoints/waypoints.repository.local';
import { createLocalRestDaysRepository } from './domain/activity/restDays.repository.local';
import { createLocalSavedMealsRepository } from './domain/saved-meals/savedMeals.repository.local';
import { createLocalMedicationRepository } from './domain/medication/medication.repository.local';
import { createLocalWaterRepository } from './domain/water/water.repository.local';
import { createLocalMoodRepository } from './domain/mood/mood.repository.local';
import { createLocalMealCheckInsRepository } from './domain/meal-check-ins/mealCheckIns.repository.local';
import { createLocalMovementRepository } from './domain/movement/movement.repository.local';
import { createLocalDataRepository } from './domain/settings/dataRepository.local';
import {
  createMemorySubscriptionRepository,
  type SubscriptionRepository,
} from './domain/subscription/subscription.repository';
import { createStoreSubscriptionRepository } from './domain/subscription/subscription.revenuecat';
import { plusUnlocked } from './domain/subscription/plusUnlocked';
import { createSupabasePlusSync } from './domain/subscription/entitlement.supabase';

/** Every repository the app persists through. Contexts read these; they never touch Supabase directly. */
export type Backend = {
  food: FoodRepository;
  weight: WeightRepository;
  settings: SettingsRepository;
  waypoints: WaypointsRepository;
  steps: StepsRepository;
  restDays: RestDaysRepository;
  savedMeals: SavedMealsRepository;
  medication: MedicationRepository;
  water: WaterRepository;
  mood: MoodRepository;
  mealCheckIns: MealCheckInsRepository;
  movement: MovementRepository;
  workouts: WorkoutsSource | null;
  commonFoods: CommonFoodsRepository;
  /**
   * Brings the server's record of Tern Plus up to date with the store, before an account
   * with Plus is written to. Only an account has one.
   */
  syncPlus?: () => Promise<boolean>;
  /** What never-saved settings start as; the app's usual defaults when absent. */
  settingsDefaults?: AppSettings;
  /** Export and erase. Absent in the memory preview, where nothing is stored. */
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
    savedMeals: createMemorySavedMealsRepository(),
    medication: createMemoryMedicationRepository(),
    water: createMemoryWaterRepository(),
    mood: createMemoryMoodRepository(),
    mealCheckIns: createMemoryMealCheckInsRepository(),
    commonFoods: createMemoryCommonFoodsRepository(),
    movement: createMemoryMovementRepository(),
    workouts: null,
  };
}

/**
 * Steps on the phone, with or without an account: the health app's, or none. Sample steps
 * instead in a local demo build (`sampleSteps`).
 */
export function createPhoneStepsRepository(): StepsRepository {
  if (sampleSteps()) return createMemoryStepsRepository();
  return createHealthStepsRepository() ?? createUnavailableStepsRepository();
}

/** In memory with nothing in it: no sample log, weigh-ins or waypoints. */
export function createBlankMemoryBackend(): Backend {
  return {
    ...createMemoryBackend(),
    food: createMemoryFoodRepository([]),
    weight: createMemoryWeightRepository([]),
    waypoints: createMemoryWaypointsRepository(0, []),
    // Stands in for the phone's database when it can't be opened, so it starts like one.
    settingsDefaults: phoneSettings,
  };
}

/**
 * Everything stored on the phone, in `db` (`openLocalDb()`): the free tier, with no account.
 * Steps and workouts still come from the phone's health app. The common-foods list is the
 * bundled seed for now, since the shared table is readable only when signed in.
 */
export function createLocalBackend(db: LocalDb): Backend {
  return {
    food: createLocalFoodRepository(db),
    weight: createLocalWeightRepository(db),
    settings: createLocalSettingsRepository(db),
    waypoints: createLocalWaypointsRepository(db),
    steps: createPhoneStepsRepository(),
    restDays: createLocalRestDaysRepository(db),
    savedMeals: createLocalSavedMealsRepository(db),
    medication: createLocalMedicationRepository(db),
    water: createLocalWaterRepository(db),
    mood: createLocalMoodRepository(db),
    mealCheckIns: createLocalMealCheckInsRepository(db),
    commonFoods: createMemoryCommonFoodsRepository(),
    movement: createLocalMovementRepository(db),
    workouts: createHealthWorkouts(),
    data: createLocalDataRepository(db),
    settingsDefaults: phoneSettings,
  };
}

/**
 * Tern Plus. Not part of `Backend`: it outlives signing in and out, since buying comes
 * before the account. Already on in a test build that unlocks it (`plusUnlocked`). Otherwise
 * the store's through RevenueCat when there's a key for this platform, or in memory, where
 * buying is free (development and Expo Go).
 */
export function createSubscriptionRepository(): SubscriptionRepository {
  if (plusUnlocked()) {
    return createMemorySubscriptionRepository({
      active: true,
      renews: false,
      expiresAt: null,
    });
  }
  return (
    createStoreSubscriptionRepository() ??
    createMemorySubscriptionRepository(undefined, undefined, {
      accountsHavePlus: true,
    })
  );
}

/**
 * Asks the server whether the signed-in account has Tern Plus, counting grants made by
 * hand; undefined without Supabase. Bound to the session, like the remote backend.
 */
export function createServerPlusGrant(): (() => Promise<boolean>) | undefined {
  return supabase ? createSupabasePlusSync(supabase) : undefined;
}

/** Repositories bound to the signed-in user's Supabase session. */
export function createRemoteBackend(): Backend {
  if (!supabase) throw new Error('Supabase is not configured');
  return {
    food: createSupabaseFoodRepository(supabase),
    weight: createSupabaseWeightRepository(supabase),
    settings: createSupabaseSettingsRepository(supabase),
    waypoints: createSupabaseWaypointsRepository(supabase),
    steps: createPhoneStepsRepository(),
    restDays: createSupabaseRestDaysRepository(supabase),
    savedMeals: createSupabaseSavedMealsRepository(supabase),
    medication: createSupabaseMedicationRepository(supabase),
    water: createSupabaseWaterRepository(supabase),
    mood: createSupabaseMoodRepository(supabase),
    mealCheckIns: createSupabaseMealCheckInsRepository(supabase),
    commonFoods: createSupabaseCommonFoodsRepository(supabase),
    movement: createSupabaseMovementRepository(supabase),
    workouts: createHealthWorkouts(),
    data: createSupabaseDataRepository(supabase),
    syncPlus: createSupabasePlusSync(supabase),
  };
}

const [BackendContext, useBackend] = createRequiredContext<Backend>(
  'useBackend',
  'BackendProvider',
);
export { useBackend };

/**
 * Erasing or restoring changes everything under the app at once, so afterwards every
 * Context below is remounted and reloads from the backend, whichever backend it is.
 */
export function BackendProvider({
  backend,
  children,
}: {
  backend: Backend;
  children: React.ReactNode;
}) {
  const [generation, setGeneration] = useState(0);
  const value = useMemo<Backend>(() => {
    const data = backend.data;
    if (!data) return backend;
    const reload = () => setGeneration((g) => g + 1);
    return {
      ...backend,
      data: {
        ...data,
        deleteAll: async () => {
          await data.deleteAll();
          reload();
        },
        deleteAccount: async () => {
          await data.deleteAccount();
          reload();
        },
        importAll: data.importAll
          ? async (copy) => {
              const added = await data.importAll!(copy);
              reload();
              return added;
            }
          : undefined,
      },
    };
  }, [backend]);
  return (
    <BackendContext.Provider value={value}>
      <React.Fragment key={generation}>{children}</React.Fragment>
    </BackendContext.Provider>
  );
}
