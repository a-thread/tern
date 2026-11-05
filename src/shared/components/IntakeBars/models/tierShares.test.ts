import { tierShares } from './tierShares';

const food = (tier: 1 | 2 | 3 | 4, calories: number, servings = 1) => ({
  tier,
  calories,
  servings,
});

describe('tierShares', () => {
  it('is all zero when nothing is logged', () => {
    expect(tierShares([], true).map((g) => g.share)).toEqual([0, 0, 0]);
  });

  it('groups tiers 1 and 2 together and weights calories by servings', () => {
    const [whole, processed, ultra] = tierShares(
      [food(1, 100), food(2, 100), food(3, 100, 2), food(4, 200)],
      true,
    );
    expect(whole.calories).toBe(200);
    expect(processed.calories).toBe(200);
    expect(ultra.calories).toBe(200);
    expect(whole.share + processed.share + ultra.share).toBeCloseTo(1);
  });

  it('splits by servings when calories are not tracked', () => {
    const [whole, processed, ultra] = tierShares(
      // A packaged food still carries its calories; it counts as one serving all the same.
      [food(1, 0, 2), food(3, 0), food(4, 250)],
      false,
    );
    expect(whole.share).toBeCloseTo(0.5);
    expect(processed.share).toBeCloseTo(0.25);
    expect(ultra.share).toBeCloseTo(0.25);
  });
});
