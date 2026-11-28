import { createMemoryConsentRepository } from './consent.repository';
import { HealthConsent } from './models/healthConsent';

describe('memory consent repository', () => {
  it('starts with no consent', async () => {
    expect(await createMemoryConsentRepository().get()).toBeNull();
  });

  it('records the version agreed to and when', async () => {
    const repo = createMemoryConsentRepository();
    const given = await repo.give(HealthConsent.POLICY_VERSION);
    expect(given.policyVersion).toBe(HealthConsent.POLICY_VERSION);
    expect(Number.isNaN(Date.parse(given.consentedAt))).toBe(false);
    expect(await repo.get()).toEqual(given);
  });

  it('forgets it once withdrawn', async () => {
    const repo = createMemoryConsentRepository();
    await repo.give(HealthConsent.POLICY_VERSION);
    await repo.withdraw();
    expect(await repo.get()).toBeNull();
  });
});
