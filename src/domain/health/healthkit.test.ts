import { Platform } from 'react-native';

import { createHealthKitApi, loadHealthKit, type HealthKitModule } from './healthkit';

const fakeModule = (over: Partial<HealthKitModule> = {}): HealthKitModule => ({
  isHealthDataAvailableAsync: async () => true,
  getRequestStatusForAuthorization: async () => 2,
  requestAuthorization: async () => true,
  queryStatisticsCollectionForQuantity: async () => [],
  queryWorkoutSamples: async () => [],
  ...over,
});

describe('createHealthKitApi', () => {
  it('needs authorization only while the permission sheet has not been shown', async () => {
    expect(await createHealthKitApi(fakeModule({ getRequestStatusForAuthorization: async () => 1 })).needsAuthorization()).toBe(true);
    expect(await createHealthKitApi(fakeModule({ getRequestStatusForAuthorization: async () => 2 })).needsAuthorization()).toBe(false);
    expect(await createHealthKitApi(fakeModule({ getRequestStatusForAuthorization: async () => 0 })).needsAuthorization()).toBe(false);
  });

  it('asks for steps and workouts in one sheet, and nothing to write', async () => {
    const requestAuthorization = jest.fn(async () => true);
    await createHealthKitApi(fakeModule({ requestAuthorization })).requestAuthorization();
    expect(requestAuthorization).toHaveBeenCalledWith({
      toRead: ['HKQuantityTypeIdentifierStepCount', 'HKWorkoutTypeIdentifier'],
    });
  });

  it('reads a cumulative daily sum of steps, in counts, anchored at the first day', async () => {
    const query = jest.fn(async () => [
      { startDate: new Date(2026, 9, 7), sumQuantity: { quantity: 8123.4 } },
      { startDate: new Date(2026, 9, 8) }, // a day with nothing recorded
    ]);
    const api = createHealthKitApi(fakeModule({ queryStatisticsCollectionForQuantity: query }));
    const from = new Date(2026, 9, 7);
    const to = new Date(2026, 9, 9);
    expect(await api.dailySteps(from, to)).toEqual([
      { day: new Date(2026, 9, 7), steps: 8123.4 },
      { day: new Date(2026, 9, 8), steps: 0 },
    ]);
    expect(query).toHaveBeenCalledWith(
      'HKQuantityTypeIdentifierStepCount',
      ['cumulativeSum'],
      from,
      { day: 1 },
      { unit: 'count', filter: { date: { startDate: from, endDate: to } } },
    );
  });

  it('turns workout samples into plain objects and releases each one', async () => {
    const dispose = jest.fn();
    const api = createHealthKitApi(
      fakeModule({
        queryWorkoutSamples: async () => [
          {
            toJSON: () => ({
              uuid: 'abc',
              startDate: new Date(2026, 9, 7, 7, 0),
              endDate: new Date(2026, 9, 7, 7, 30),
              workoutActivityType: 37,
            }),
            dispose,
          },
        ],
      }),
    );
    expect(await api.workouts(new Date(2026, 9, 7), new Date(2026, 9, 8))).toEqual([
      { id: 'abc', start: new Date(2026, 9, 7, 7, 0), end: new Date(2026, 9, 7, 7, 30), activityType: 37 },
    ]);
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});

describe('loadHealthKit', () => {
  const flag = process.env.EXPO_PUBLIC_HEALTH;
  afterEach(() => {
    jest.restoreAllMocks();
    process.env.EXPO_PUBLIC_HEALTH = flag;
  });

  it('is off on Android', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    process.env.EXPO_PUBLIC_HEALTH = '1';
    expect(loadHealthKit()).toBeNull();
  });

  it('is off on iPhone unless the health flag is set', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    process.env.EXPO_PUBLIC_HEALTH = '';
    expect(loadHealthKit()).toBeNull();
  });
});
