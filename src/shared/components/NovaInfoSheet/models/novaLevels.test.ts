import { TierGroups } from '../../IntakeBars/models/tierShares';
import { NovaLevels } from './novaLevels';

describe('NovaLevels', () => {
  it('explains every level once, from 1 to 4', () => {
    expect(NovaLevels.ALL.map((l) => l.tier)).toEqual([1, 2, 3, 4]);
  });

  it('names each level by the food type it is logged as', () => {
    for (const level of NovaLevels.ALL) {
      const group = TierGroups.ALL.find((g) => g.tiers.includes(level.tier));
      expect(level.choice).toBe(group?.label);
    }
  });

  it('gives examples for every level', () => {
    for (const level of NovaLevels.ALL) expect(level.examples).not.toBe('');
  });
});
