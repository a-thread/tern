import { isKept, keepRecipe, RecipeSwapLimits, unkeepRecipe } from './recipeSwap';
import type { Dish } from './ternary';

const dish = (id: string): Dish => ({
  id,
  fromName: 'Maya',
  fromId: 'maya',
  stop: '1-iceland',
  name: `Soup ${id}`,
  foods: ['Lentils', 'Carrot'],
  yours: false,
});

describe('kept recipes', () => {
  it('keeps a dish’s name, foods and who shared it, newest first', () => {
    const kept = keepRecipe(keepRecipe([], dish('a')), dish('b'));
    expect(kept.map((k) => k.id)).toEqual(['b', 'a']);
    expect(kept[0]).toEqual({
      id: 'b',
      name: 'Soup b',
      foods: ['Lentils', 'Carrot'],
      fromName: 'Maya',
    });
  });

  it('keeps a dish only once', () => {
    const kept = keepRecipe(keepRecipe([], dish('a')), dish('a'));
    expect(kept).toHaveLength(1);
  });

  it('lets one go', () => {
    const kept = keepRecipe([], dish('a'));
    expect(isKept(kept, 'a')).toBe(true);
    expect(isKept(unkeepRecipe(kept, 'a'), 'a')).toBe(false);
  });

  it('stays a short list', () => {
    let kept = keepRecipe([], dish('0'));
    for (let i = 1; i <= RecipeSwapLimits.MAX_KEPT + 5; i++) kept = keepRecipe(kept, dish(`${i}`));
    expect(kept).toHaveLength(RecipeSwapLimits.MAX_KEPT);
  });
});
