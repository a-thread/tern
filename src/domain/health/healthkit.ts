import { Platform } from 'react-native';

import { healthEnabled } from './healthEnabled';

/** A workout as HealthKit reports it, trimmed to what Tern uses. */
export type HealthKitWorkout = {
  id: string;
  start: Date;
  end: Date;
  /** HKWorkoutActivityType's raw value (Apple's own numbering, e.g. 37 = running). */
  activityType: number;
};

/**
 * The few HealthKit calls Tern makes, so the adapters and their tests don't depend on the
 * native library. `createHealthKitApi` wires it to `@kingstinct/react-native-healthkit`.
 */
export interface HealthKitApi {
  /** False on a device without Apple Health (e.g. some iPads) or when it is restricted. */
  isAvailable(): Promise<boolean>;
  /** True until the permission sheet has been shown once. HealthKit never says what was answered. */
  needsAuthorization(): Promise<boolean>;
  /** Shows the permission sheet for steps and workouts (it only appears the first time). */
  requestAuthorization(): Promise<void>;
  /** Total steps for each local day from `from` (a local midnight) up to `to`, already de-duplicated across sources. */
  dailySteps(from: Date, to: Date): Promise<{ day: Date; steps: number }[]>;
  /** Workouts that started between `from` and `to`. */
  workouts(from: Date, to: Date): Promise<HealthKitWorkout[]>;
}

const STEPS = 'HKQuantityTypeIdentifierStepCount';
const WORKOUTS = 'HKWorkoutTypeIdentifier';
// AuthorizationRequestStatus.shouldRequest in the library: the sheet has not been shown yet.
const SHOULD_REQUEST = 1;

/** The slice of `@kingstinct/react-native-healthkit` that Tern uses. */
export type HealthKitModule = {
  isHealthDataAvailableAsync: () => Promise<boolean>;
  getRequestStatusForAuthorization: (types: {
    toRead: readonly string[];
  }) => Promise<number>;
  requestAuthorization: (types: {
    toRead: readonly string[];
  }) => Promise<boolean>;
  queryStatisticsCollectionForQuantity: (
    identifier: string,
    statistics: readonly string[],
    anchorDate: Date,
    interval: { day: number },
    options?: {
      unit?: string;
      filter?: { date?: { startDate?: Date; endDate?: Date } };
    },
  ) => Promise<
    readonly { startDate?: Date; sumQuantity?: { quantity: number } }[]
  >;
  queryWorkoutSamples: (options: {
    limit: number;
    ascending?: boolean;
    filter?: { date?: { startDate?: Date; endDate?: Date } };
  }) => Promise<
    readonly {
      toJSON(): {
        uuid: string;
        startDate: Date;
        endDate: Date;
        workoutActivityType: number;
      };
      dispose?: () => void;
    }[]
  >;
};

export function createHealthKitApi(hk: HealthKitModule): HealthKitApi {
  const toRead = [STEPS, WORKOUTS] as const;
  return {
    isAvailable: () => hk.isHealthDataAvailableAsync(),
    needsAuthorization: async () =>
      (await hk.getRequestStatusForAuthorization({ toRead })) ===
      SHOULD_REQUEST,
    requestAuthorization: async () => {
      await hk.requestAuthorization({ toRead });
    },
    dailySteps: async (from, to) => {
      const rows = await hk.queryStatisticsCollectionForQuantity(
        STEPS,
        ['cumulativeSum'],
        from,
        { day: 1 },
        {
          unit: 'count',
          filter: { date: { startDate: from, endDate: to } },
        },
      );
      return rows
        .filter((r) => r.startDate)
        .map((r) => ({
          day: r.startDate as Date,
          steps: r.sumQuantity?.quantity ?? 0,
        }));
    },
    workouts: async (from, to) => {
      const samples = await hk.queryWorkoutSamples({
        limit: 0,
        ascending: true,
        filter: { date: { startDate: from, endDate: to } },
      });
      return samples.map((sample) => {
        const w = sample.toJSON();
        sample.dispose?.(); // the native sample must be released once read
        return {
          id: w.uuid,
          start: w.startDate,
          end: w.endDate,
          activityType: Number(w.workoutActivityType),
        };
      });
    },
  };
}

/**
 * HealthKit on iPhone, or null: on any other platform, with the health flag off, or if the
 * package isn't in this build (Expo Go). Metro turns a require of a missing package into a
 * runtime error even inside try/catch, so this must never be reached without it installed.
 */
export function loadHealthKit(): HealthKitApi | null {
  if (Platform.OS !== 'ios' || !healthEnabled()) return null;
  let hk: HealthKitModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    hk = require('@kingstinct/react-native-healthkit');
  } catch {
    return null;
  }
  if (typeof hk?.requestAuthorization !== 'function') return null;
  return createHealthKitApi(hk);
}
