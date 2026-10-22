import { NO_SUBSCRIPTION } from '@/domain/subscription/models/subscription';
import { PlusAction, plusSummary } from './plusSummary';

const base = { signedIn: true, known: true, lapsed: false, status: NO_SUBSCRIPTION };
// Noon UTC, so the day is the same in any time zone the tests run in.
const NOV_21 = '2026-11-21T12:00:00.000Z';
const MANAGE = 'Manage subscription';

describe('plusSummary', () => {
  it('offers Plus on the phone without an account', () => {
    expect(plusSummary({ ...base, signedIn: false })).toEqual({
      title: MANAGE,
      summary: 'Tern Plus is off · sync and back up your log',
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
      title: MANAGE,
      summary: 'Tern Plus is on · make an account to start syncing',
      action: PlusAction.MakeAccount,
    });
  });

  it('says when a subscription renews, and opens the store to manage it', () => {
    expect(
      plusSummary({ ...base, status: { active: true, renews: true, expiresAt: NOV_21 } }),
    ).toEqual({ title: MANAGE, summary: 'Tern Plus · renews Nov 21', action: PlusAction.Manage });
  });

  it('says when a cancelled subscription ends', () => {
    expect(
      plusSummary({ ...base, status: { active: true, renews: false, expiresAt: NOV_21 } }),
    ).toEqual({
      title: MANAGE,
      summary: "Tern Plus until Nov 21 · won't renew",
      action: PlusAction.Manage,
    });
  });

  it('names Plus granted by hand rather than offering to manage it', () => {
    expect(
      plusSummary({ ...base, status: { active: true, renews: false, expiresAt: null } }),
    ).toEqual({
      title: 'Tern Plus',
      summary: 'Included with your account',
      action: PlusAction.None,
    });
  });

  it('offers to renew once Plus has ended', () => {
    expect(plusSummary({ ...base, lapsed: true })).toEqual({
      title: MANAGE,
      summary: 'Tern Plus ended · your log is kept on this phone',
      action: PlusAction.Renew,
    });
  });

  it('claims nothing when the store could not be reached', () => {
    expect(plusSummary({ ...base, known: false })).toEqual({
      title: MANAGE,
      summary: "Couldn't check Tern Plus just now",
      action: PlusAction.None,
    });
  });
});
