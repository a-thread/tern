import { tierShares } from './tierShares';

const food = (tier: 1 | 2 | 3 | 4, calories: number, servings = 1) => ({
  tier,
  calories,
  servings,
});

describe('tierShares', () => {
  it('is all zero when nothing is logged', () => {
    expect(tierShares([]).map((g) => g.share)).toEqual([0, 0, 0]);
  });

  it('groups tiers 1 and 2 together and weights by servings', () => {
    const [whole, processed, ultra] = tierShares([
      food(1, 100),
      food(2, 100),
      food(3, 100, 2),
      food(4, 200),
    ]);
    expect(whole.calories).toBe(200);
    expect(processed.calories).toBe(200);
    expect(ultra.calories).toBe(200);
    expect(whole.share + processed.share + ultra.share).toBeCloseTo(1);
  });
});
