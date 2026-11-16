import { SupportOffer, supportOffer } from './supportOffer';

const none = {
  accounts: false,
  signedIn: false,
  active: false,
  supporter: false,
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
    expect(
      supportOffer({
        ...none,
        accounts: true,
        signedIn: true,
        active: true,
        lapsed: true,
      }),
    ).toBe(SupportOffer.Join);
  });

  it('offers nothing while the store has not answered for a signed-in account', () => {
    // Neither active nor lapsed: signing in again would open nothing.
    expect(supportOffer({ ...none, accounts: true, signedIn: true })).toBe(
      SupportOffer.None,
    );
  });

  it('thanks someone on Plus, and a Supporter', () => {
    expect(
      supportOffer({ ...none, accounts: true, signedIn: true, active: true }),
    ).toBe(SupportOffer.PlusThanks);
    expect(supportOffer({ ...none, active: true, supporter: true })).toBe(
      SupportOffer.SupporterThanks,
    );
  });

  it('shows nothing with no account backend and no Plus', () => {
    expect(supportOffer(none)).toBe(SupportOffer.None);
  });
});
