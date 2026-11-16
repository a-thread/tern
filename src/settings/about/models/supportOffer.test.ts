import { SupportOffer, supportOffer } from './supportOffer';

const none = {
  accounts: false,
  signedIn: false,
  active: false,
  lapsed: false,
};

describe('supportOffer', () => {
  it('offers Supporter to someone signed out with no Plus', () => {
    expect(supportOffer({ ...none, accounts: true })).toBe(SupportOffer.Join);
  });

  it('offers Supporter again when a signed-in account has lapsed', () => {
    expect(
      supportOffer({ ...none, accounts: true, signedIn: true, lapsed: true }),
    ).toBe(SupportOffer.Join);
  });

  it('offers nothing while the store has not answered for a signed-in account', () => {
    // Neither active nor lapsed: signing in again would open nothing.
    expect(supportOffer({ ...none, accounts: true, signedIn: true })).toBe(
      SupportOffer.None,
    );
  });

  it('asks nothing of someone who already has Plus: Your data shows their plan', () => {
    expect(supportOffer({ ...none, accounts: true, active: true })).toBe(
      SupportOffer.None,
    );
    expect(
      supportOffer({ ...none, accounts: true, signedIn: true, active: true }),
    ).toBe(SupportOffer.None);
  });

  it('shows nothing with no account backend', () => {
    expect(supportOffer(none)).toBe(SupportOffer.None);
    expect(supportOffer({ ...none, active: true })).toBe(SupportOffer.None);
  });
});
