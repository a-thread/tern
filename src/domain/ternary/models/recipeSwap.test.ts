import {
  cleanSharedItems,
  isKept,
  keepRecipe,
  SharedItemLimits,
  unkeepRecipe,
} from './recipeSwap';
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

  it('keeps every one, however many', () => {
    let kept = keepRecipe([], dish('0'));
    for (let i = 1; i < 100; i++) kept = keepRecipe(kept, dish(`${i}`));
    expect(kept).toHaveLength(100);
    expect(kept[99].id).toBe('0');
  });
});

describe('a friend’s recipe as it arrives', () => {
  it('caps what could break your meals: servings, names and labels', () => {
    const [item] = cleanSharedItems([
      {
        name: 'n'.repeat(500),
        brand: 'b'.repeat(500),
        servings: 1e9,
        servingLabel: 'l'.repeat(500),
        calories: 100,
        tier: 2,
      },
    ])!;
    expect(item.servings).toBe(100);
    expect(item.name).toHaveLength(SharedItemLimits.MAX_NAME);
    expect(item.brand).toHaveLength(SharedItemLimits.MAX_BRAND);
    expect(item.servingLabel).toHaveLength(SharedItemLimits.MAX_LABEL);
  });

  it('gives a food with no label a plain serving', () => {
    const [item] = cleanSharedItems([{ name: 'Rice', servings: 2 }])!;
    expect(item.servingLabel).toBe('1 serving');
  });
});
