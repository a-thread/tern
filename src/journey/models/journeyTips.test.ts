import { Tip, Tips } from '@/domain/settings/models/onboarding';
import { journeyTipText } from './journeyTips';

describe('journeyTipText', () => {
  it('gives every tip on Journey its own words', () => {
    const leads = Tips.JOURNEY.map((t) => journeyTipText(t).lead);
    expect(new Set(leads).size).toBe(Tips.JOURNEY.length);
  });

  it('tells you to tap a stop on the map', () => {
    expect(journeyTipText(Tip.MapStops).lead).toBe(
      'Tap a stop to see where it is.',
    );
  });
});
