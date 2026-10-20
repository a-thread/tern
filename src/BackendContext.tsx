import React from 'react';
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

/** Repositories bound to the signed-in user's Supabase session. */
export function createRemoteBackend(): Backend {
  if (!supabase) throw new Error('Supabase is not configured');
  return {
    food: createSupabaseFoodRepository(supabase),
    weight: createSupabaseWeightRepository(supabase),
    settings: createSupabaseSettingsRepository(supabase),
    waypoints: createSupabaseWaypointsRepository(supabase),
    steps: createHealthStepsRepository() ?? createUnavailableStepsRepository(),
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
  };
}

const [BackendContext, useBackend] = createRequiredContext<Backend>(
  'useBackend',
  'BackendProvider',
);
export { useBackend };

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
