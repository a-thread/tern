import {
  HealthConsent,
  hasCurrentConsent,
  readRememberedConsent,
  rememberedConsent,
} from './healthConsent';

describe('remembered consent', () => {
  const record = {
    policyVersion: HealthConsent.POLICY_VERSION,
    consentedAt: '2026-11-22T10:00:00Z',
  };

  it("reads back the account's own record", () => {
    expect(
      readRememberedConsent(rememberedConsent('me', record), 'me'),
    ).toEqual(record);
  });

  it("ignores another account's record and anything unreadable", () => {
    expect(
      readRememberedConsent(rememberedConsent('other', record), 'me'),
    ).toBeNull();
    expect(readRememberedConsent('not json', 'me')).toBeNull();
    expect(readRememberedConsent('{"userId":"me"}', 'me')).toBeNull();
    expect(readRememberedConsent(null, 'me')).toBeNull();
  });
});

describe('hasCurrentConsent', () => {
  it('needs consent to the current policy version', () => {
    expect(
      hasCurrentConsent({
        policyVersion: HealthConsent.POLICY_VERSION,
        consentedAt: '2026-11-22T10:00:00Z',
      }),
    ).toBe(true);
  });

  it('asks again for an older version or none', () => {
    expect(
      hasCurrentConsent({
        policyVersion: '2020-01',
        consentedAt: '2020-01-01T00:00:00Z',
      }),
    ).toBe(false);
    expect(hasCurrentConsent(null)).toBe(false);
  });
});
