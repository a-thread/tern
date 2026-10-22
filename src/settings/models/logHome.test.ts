import { LogHome, logHome } from './logHome';

describe('logHome', () => {
  it('is the phone when signed out', () => {
    expect(logHome({ signedIn: false, lapsed: false })).toBe(LogHome.Phone);
  });

  it('is the account when signed in with Plus', () => {
    expect(logHome({ signedIn: true, lapsed: false })).toBe(LogHome.Account);
  });

  it('is the phone again once Plus has ended', () => {
    expect(logHome({ signedIn: true, lapsed: true })).toBe(LogHome.Phone);
  });
});
