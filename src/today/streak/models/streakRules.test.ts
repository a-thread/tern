import { StreakFreezes } from '@/domain/activity/models/dayRecord';
import { streakRules } from './streakRules';

describe('streakRules', () => {
  it('names the movement goal only when movement is tracked', () => {
    expect(streakRules({ movement: true }).streak[0]).toMatch(/movement goal/);
    expect(streakRules({ movement: false }).streak[0]).not.toMatch(/movement/);
  });

  it('says how freezes are earned and how many can be held, from the rules themselves', () => {
    const { freezes } = streakRules({ movement: false });
    expect(freezes[0]).toContain(`every ${StreakFreezes.EVERY} days in a row`);
    expect(freezes[1]).toContain(`up to ${StreakFreezes.MAX}`);
  });
});
