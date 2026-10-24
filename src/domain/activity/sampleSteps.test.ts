import eas from '../../../eas.json';
import { createPhoneStepsRepository } from '../../BackendContext';
import { StepsStatus } from './models/stepsStatus';
import { sampleSteps } from './sampleSteps';

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
