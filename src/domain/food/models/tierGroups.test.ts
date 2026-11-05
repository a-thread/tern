import { tierGroupA11yLabel, tierGroupOf, TierGroups } from './tierGroups';

describe('TierGroups', () => {
  it('puts every tier in exactly one group', () => {
    expect(TierGroups.ALL.flatMap((g) => g.tiers).sort()).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('logs tiers 1 and 2 as Whole', () => {
    expect(tierGroupOf(1).label).toBe('Whole');
    expect(tierGroupOf(2).label).toBe('Whole');
    expect(tierGroupOf(4).label).toBe('Ultra-processed');
  });

  it('names the tiers for screen readers', () => {
    expect(tierGroupA11yLabel(tierGroupOf(1))).toBe('Whole, NOVA 1 or 2');
    expect(tierGroupA11yLabel(tierGroupOf(3))).toBe('Processed, NOVA 3');
  });
});
