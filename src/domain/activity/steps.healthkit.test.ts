import type { HealthKitApi } from '../health/healthkit';
import { createHealthKitStepsRepository } from './steps.healthkit';
import { StepsStatus } from './steps.repository';

const api = (over: Partial<HealthKitApi> = {}): HealthKitApi => ({
  isAvailable: async () => true,
  needsAuthorization: async () => false,
  requestAuthorization: async () => {},
  dailySteps: async () => [],
  workouts: async () => [],
  ...over,
});

describe('HealthKit steps', () => {
  it('is null where there is no HealthKit', () => {
    expect(createHealthKitStepsRepository(null)).toBeNull();
  });

  it('needs permission until the sheet has been shown, then counts as connected', async () => {
    let needs = true;
    const repo = createHealthKitStepsRepository(api({ needsAuthorization: async () => needs }))!;
    expect(await repo.status()).toBe(StepsStatus.NeedsPermission);
    needs = false;
    expect(await repo.status()).toBe(StepsStatus.Connected);
  });

  it('is unavailable on a device without Apple Health, and when the check throws', async () => {
    expect(await createHealthKitStepsRepository(api({ isAvailable: async () => false }))!.status()).toBe(StepsStatus.Unavailable);
    const broken = api({
      isAvailable: async () => {
        throw new Error('nope');
      },
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await createHealthKitStepsRepository(broken)!.status()).toBe(StepsStatus.Unavailable);
  });

  it('shows the permission sheet on connect and reports the status afterwards', async () => {
    let needs = true;
    const requestAuthorization = jest.fn(async () => {
      needs = false;
    });
    const repo = createHealthKitStepsRepository(api({ needsAuthorization: async () => needs, requestAuthorization }))!;
    expect(await repo.connect()).toBe(StepsStatus.Connected);
    expect(requestAuthorization).toHaveBeenCalledTimes(1);
  });

  it('does not ask on a device without Apple Health', async () => {
    const requestAuthorization = jest.fn(async () => {});
    const repo = createHealthKitStepsRepository(api({ isAvailable: async () => false, requestAuthorization }))!;
    expect(await repo.connect()).toBe(StepsStatus.Unavailable);
    expect(requestAuthorization).not.toHaveBeenCalled();
  });

  it('returns whole steps per local day, asking up to the end of the last day', async () => {
    const dailySteps = jest.fn(async () => [
      { day: new Date(2026, 9, 7), steps: 8123.4 },
      { day: new Date(2026, 9, 8), steps: 0 },
    ]);
    const repo = createHealthKitStepsRepository(api({ dailySteps }))!;
    expect(await repo.getRange('2026-10-07', '2026-10-08')).toEqual({ '2026-10-07': 8123, '2026-10-08': 0 });
    expect(dailySteps).toHaveBeenCalledWith(new Date(2026, 9, 7), new Date(2026, 9, 9));
  });

  it('reads nothing until permission has been asked for', async () => {
    const dailySteps = jest.fn(async () => [{ day: new Date(2026, 9, 7), steps: 5 }]);
    const repo = createHealthKitStepsRepository(api({ needsAuthorization: async () => true, dailySteps }))!;
    expect(await repo.getRange('2026-10-07', '2026-10-07')).toEqual({});
    expect(dailySteps).not.toHaveBeenCalled();
  });
});
