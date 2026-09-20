import type { FoodEntry } from './models';
import { additionsSince, describeAdditions } from './sessionAdditions';

const entry = (name: string, meal: FoodEntry['meal'] = 'lunch'): FoodEntry => ({
  id: `id-${name}`,
  name,
  meal,
  servings: 1,
  servingLabel: '1 serving',
  calories: 100,
  protein: 1,
  carbs: 1,
  fat: 1,
  tier: 1,
});

describe('additionsSince', () => {
  it('returns only entries that were not in the baseline', () => {
    const before = [entry('Oats', 'breakfast')];
    const baseline = new Set(before.map((f) => f.id));
    const now = [...before, entry('Banana'), entry('Coffee')];
    expect(additionsSince(baseline, now).map((f) => f.name)).toEqual(['Banana', 'Coffee']);
  });

  it('is empty when nothing changed, and ignores removals', () => {
    const baseline = new Set(['id-Oats', 'id-Toast']);
    expect(additionsSince(baseline, [entry('Oats'), entry('Toast')])).toEqual([]);
    expect(additionsSince(baseline, [entry('Oats')])).toEqual([]);
  });
});

describe('describeAdditions', () => {
  it('says nothing when nothing was added', () => {
    expect(describeAdditions([])).toBeNull();
  });

  it('names the meal and the foods', () => {
    expect(describeAdditions([entry('Oats')])).toBe('Added to Lunch: Oats');
    expect(describeAdditions([entry('Oats'), entry('Banana')])).toBe('Added to Lunch: Oats, Banana');
  });

  it('shortens a long list', () => {
    expect(describeAdditions([entry('A'), entry('B'), entry('C'), entry('D')])).toBe(
      'Added to Lunch: A, B (+2 more)',
    );
  });

  it('falls back to a count when foods went to different meals', () => {
    expect(describeAdditions([entry('Oats', 'breakfast'), entry('Soup', 'lunch')])).toBe(
      'Added 2 foods: Oats, Soup',
    );
  });
});
