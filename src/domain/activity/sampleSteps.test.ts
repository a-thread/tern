import eas from '../../../eas.json';
import { createPhoneStepsRepository } from '../../BackendContext';
import { StepsStatus } from './models/stepsStatus';
import { sampleStepDays, sampleSteps } from './sampleSteps';
import { createMemoryStepsRepository } from './steps.repository';

type Profile = { env?: Record<string, string> };
const profiles = eas.build as Record<string, Profile>;

describe('sample steps for local demo builds', () => {
  const before = process.env.EXPO_PUBLIC_SAMPLE_STEPS;
  afterEach(() => {
    // Assigning undefined would store the string "undefined".
    if (before === undefined) delete process.env.EXPO_PUBLIC_SAMPLE_STEPS;
    else process.env.EXPO_PUBLIC_SAMPLE_STEPS = before;
  });

  it('is never on in an EAS build', () => {
    for (const profile of Object.values(profiles)) {
      expect(profile.env?.EXPO_PUBLIC_SAMPLE_STEPS).toBeUndefined();
      expect(profile.env?.EXPO_PUBLIC_SAMPLE_STEP_DAYS).toBeUndefined();
    }
  });

  it('reads sample steps in place of the health app', async () => {
    process.env.EXPO_PUBLIC_SAMPLE_STEPS = '1';
    expect(sampleSteps()).toBe(true);
    const steps = createPhoneStepsRepository();
    expect(await steps.status()).toBe(StepsStatus.Connected);
    expect(
      Object.keys(await steps.getRange('2026-01-01', '2026-01-07')),
    ).toHaveLength(7);
  });

  it('leaves steps to the health app otherwise', async () => {
    delete process.env.EXPO_PUBLIC_SAMPLE_STEPS;
    expect(sampleSteps()).toBe(false);
    // No health app in tests, so no steps.
    expect(await createPhoneStepsRepository().status()).not.toBe(
      StepsStatus.Connected,
    );
  });
});

describe('a short sample history', () => {
  const before = process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS;
  afterEach(() => {
    if (before === undefined) delete process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS;
    else process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS = before;
  });

  it('reads the number of days, or every day when unset or not a positive whole number', () => {
    process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS = '3';
    expect(sampleStepDays()).toBe(3);
    for (const v of ['', '0', '-2', '2.5', 'abc']) {
      process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS = v;
      expect(sampleStepDays()).toBeUndefined();
    }
    delete process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS;
    expect(sampleStepDays()).toBeUndefined();
  });

  it('has steps only for the last that many days, today included', async () => {
    const now = () => new Date(2026, 10, 7, 9);
    const steps = createMemoryStepsRepository(now, 3);
    expect(
      Object.keys(await steps.getRange('2026-10-09', '2026-11-07')),
    ).toEqual(['2026-11-05', '2026-11-06', '2026-11-07']);
    expect(await steps.getRange('2026-10-01', '2026-11-04')).toEqual({});
  });

  it('keeps every day without a limit', async () => {
    const now = () => new Date(2026, 10, 7, 9);
    const steps = createMemoryStepsRepository(now);
    expect(
      Object.keys(await steps.getRange('2026-10-09', '2026-11-07')),
    ).toHaveLength(30);
  });
});
