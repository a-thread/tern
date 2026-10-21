import { SubscriptionConfig } from '../../../src/domain/subscription/models/subscription';
import {
  accountsIn,
  ENTITLEMENT,
  isWebhookAuthorized,
  plusFrom,
  stillCounts,
} from './entitlement';

const ME = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const OTHER = '0a1b2c3d-4e5f-4a6b-9c7d-8e9f0a1b2c3d';

describe('the plus function', () => {
  it('names the same entitlement as the app', () => {
    expect(ENTITLEMENT).toBe(SubscriptionConfig.ENTITLEMENT);
  });

  describe('accountsIn', () => {
    it('finds every account an event names, once, and no anonymous ids', () => {
      expect(
        accountsIn({
          type: 'TRANSFER',
          app_user_id: '$RCAnonymousID:abc',
          original_app_user_id: ME,
          aliases: ['$RCAnonymousID:abc', ME],
          transferred_from: [OTHER],
          transferred_to: [ME],
        }),
      ).toEqual([ME, OTHER]);
    });

    it('finds nothing in a test event', () => {
      expect(accountsIn({ type: 'TEST', app_user_id: 'test-user' })).toEqual([]);
    });
  });

  describe('plusFrom', () => {
    it('has no Plus without the entitlement', () => {
      expect(plusFrom({ subscriber: { entitlements: {} } })).toEqual({ entitled: false });
      expect(plusFrom({})).toEqual({ entitled: false });
    });

    it('runs Plus to the later of the expiry and the grace period', () => {
      expect(
        plusFrom({
          subscriber: {
            entitlements: {
              plus: {
                expires_date: '2026-11-01T00:00:00Z',
                grace_period_expires_date: '2026-11-15T00:00:00Z',
              },
            },
          },
        }),
      ).toEqual({ entitled: true, expiresAt: '2026-11-15T00:00:00Z' });
    });

    it('records an expiry that has passed, for the database to compare', () => {
      expect(
        plusFrom({
          subscriber: { entitlements: { plus: { expires_date: '2020-01-01T00:00:00Z' } } },
        }),
      ).toEqual({ entitled: true, expiresAt: '2020-01-01T00:00:00Z' });
    });

    it('treats a grant with no expiry as not ending', () => {
      expect(
        plusFrom({ subscriber: { entitlements: { plus: { expires_date: null } } } }),
      ).toEqual({ entitled: true, expiresAt: null });
    });
  });

  describe('stillCounts', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    it('counts no expiry, a future one, and one less than a day past', () => {
      expect(stillCounts(null, now)).toBe(true);
      expect(stillCounts('2026-11-20T00:00:00Z', now)).toBe(true);
      expect(stillCounts('2026-10-20T00:00:00Z', now)).toBe(true);
    });

    it('stops counting a day after the expiry', () => {
      expect(stillCounts('2026-10-19T11:00:00Z', now)).toBe(false);
    });
  });

  describe('isWebhookAuthorized', () => {
    it('accepts the secret, with or without "Bearer"', () => {
      expect(isWebhookAuthorized('s3cret', 's3cret')).toBe(true);
      expect(isWebhookAuthorized('Bearer s3cret', 's3cret')).toBe(true);
    });

    it('refuses anything else, and everything when no secret is set', () => {
      expect(isWebhookAuthorized('s3crex', 's3cret')).toBe(false);
      expect(isWebhookAuthorized(null, 's3cret')).toBe(false);
      expect(isWebhookAuthorized('', '')).toBe(false);
      expect(isWebhookAuthorized('anything', '')).toBe(false);
    });
  });
});
