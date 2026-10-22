import { NO_SUBSCRIPTION } from '@/domain/subscription/models/subscription';
import { PlusAction, plusSummary } from './plusSummary';

const base = {
  signedIn: true,
  known: true,
  lapsed: false,
  status: NO_SUBSCRIPTION,
  store: 'Google Play',
};
// Noon UTC, so the day is the same in any time zone the tests run in.
const NOV_21 = '2026-11-21T12:00:00.000Z';

describe('plusSummary', () => {
  it('points someone without an account to Tern Plus', () => {
    expect(plusSummary({ ...base, signedIn: false })).toEqual({
      title: 'Kept on this phone',
      summary: 'Learn about Tern Plus',
      link: true,
      action: PlusAction.Subscribe,
    });
  });

  it('sends someone who bought Plus before making an account to make one', () => {
    expect(
      plusSummary({
        ...base,
        signedIn: false,
        status: { active: true, renews: true, expiresAt: NOV_21 },
      }),
    ).toEqual({
      title: 'Kept on this phone',
      summary: 'Tern Plus is on · make your account',
      link: true,
      action: PlusAction.MakeAccount,
    });
  });

  it('says when a subscription renews, where to cancel, and that nothing is lost', () => {
    expect(
      plusSummary({ ...base, status: { active: true, renews: true, expiresAt: NOV_21 } }),
    ).toEqual({
      title: 'Synced to your account',
      summary: 'Tern Plus · renews Nov 21',
      link: false,
      footnote:
        'Change plan or cancel in Google Play. If Plus ends, your data is kept on this phone.',
      action: PlusAction.Manage,
    });
  });

  it('says when a cancelled subscription ends', () => {
    expect(
      plusSummary({ ...base, status: { active: true, renews: false, expiresAt: NOV_21 } }),
    ).toMatchObject({
      summary: "Tern Plus until Nov 21 · won't renew",
      action: PlusAction.Manage,
    });
  });

  it('says Plus granted by hand is included, with nothing to manage', () => {
    expect(
      plusSummary({ ...base, status: { active: true, renews: false, expiresAt: null } }),
    ).toEqual({
      title: 'Synced to your account',
      summary: 'Tern Plus · included with your account',
      link: false,
      action: PlusAction.None,
    });
  });

  it('offers to renew once Plus has ended', () => {
    expect(plusSummary({ ...base, lapsed: true })).toEqual({
      title: 'Kept on this phone',
      summary: 'Renew Tern Plus to sync again',
      link: true,
      action: PlusAction.Renew,
    });
  });

  it('claims nothing when the store could not be reached', () => {
    expect(plusSummary({ ...base, known: false })).toEqual({
      title: 'Synced to your account',
      summary: "Couldn't check Tern Plus just now",
      link: false,
      action: PlusAction.None,
    });
  });
});
