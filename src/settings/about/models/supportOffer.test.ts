import { SupportOffer, supportOffer } from './supportOffer';

const none = {
  accounts: false,
  active: false,
  supporter: false,
  lapsed: false,
};

describe('supportOffer', () => {
  it('offers Supporter when accounts are available and there is no Plus', () => {
    expect(supportOffer({ ...none, accounts: true })).toBe(SupportOffer.Join);
  });

  it('offers Supporter again when Plus has lapsed', () => {
    expect(
      supportOffer({ ...none, accounts: true, active: true, lapsed: true }),
    ).toBe(SupportOffer.Join);
  });

  it('thanks someone on Plus, and a Supporter', () => {
    expect(supportOffer({ ...none, accounts: true, active: true })).toBe(
      SupportOffer.PlusThanks,
    );
    expect(supportOffer({ ...none, active: true, supporter: true })).toBe(
      SupportOffer.SupporterThanks,
    );
  });

  it('shows nothing with no account backend and no Plus', () => {
    expect(supportOffer(none)).toBe(SupportOffer.None);
  });
});
