import { Tip, Tips } from '@/domain/settings/models/onboarding';
import { todayTipText } from './todayTips';

describe('todayTipText', () => {
  it('gives every tip on Today its own words', () => {
    const leads = Tips.TODAY.map((t) => todayTipText(t, 2).lead);
    expect(new Set(leads).size).toBe(Tips.TODAY.length);
  });

  it('points at settings and each tab', () => {
    expect(todayTipText(Tip.Settings, 2).lead).toBe('Settings are here.');
    expect(todayTipText(Tip.TabFood, 2).lead).toBe('Food is your log.');
    expect(todayTipText(Tip.TabJourney, 2).lead).toBe(
      'Journey is your migration.',
    );
  });

  it('says how many rest days there are', () => {
    expect(todayTipText(Tip.RestDay, 3).rest).toMatch(/You get 3 a week/);
  });
});
