import type { FoodEntry } from './models';
import {
  SCALE_MAX,
  SCALE_MIN,
  addItem,
  draftFromMeal,
  emptyDraft,
  isDraftDirty,
  removeItemAt,
  scaledTotals,
  stepItemServings,
  stepScale,
  validateDraft,
} from './mealDraft';
import {
  MAX_MEAL_ITEMS,
  itemsToEntries,
  scaleServings,
  snapshotItems,
  type SavedMeal,
} from './savedMeals';

const item = (name: string, servings = 1, calories = 100) => {
  const entry: FoodEntry = {
    id: name,
    name,
    meal: 'breakfast',
    servings,
    servingLabel: '1 serving',
    calories,
    protein: 5,
    carbs: 10,
    fat: 2,
    tier: 1,
  };
  return snapshotItems([entry])[0];
};

describe('scaling a whole meal', () => {
  it('multiplies servings without floating-point mess', () => {
    expect(scaleServings(1, 0.5)).toBe(0.5);
    expect(scaleServings(1.5, 0.75)).toBe(1.13);
    expect(scaleServings(2, 1.25)).toBe(2.5);
  });

  it('logs scaled entries and leaves the saved items alone', () => {
    const items = [item('Oats', 1, 150), item('Banana', 2, 100)];
    const entries = itemsToEntries(items, 'lunch', 0.5);
    expect(entries.map((e) => e.servings)).toEqual([0.5, 1]);
    expect(items.map((i) => i.servings)).toEqual([1, 2]);
    expect(itemsToEntries(items, 'lunch').map((e) => e.servings)).toEqual([1, 2]);
  });

  it('steps the scale by a quarter, within limits', () => {
    expect(stepScale(1, 1)).toBe(1.25);
    expect(stepScale(1, -1)).toBe(0.75);
    expect(stepScale(SCALE_MIN, -1)).toBe(SCALE_MIN);
    expect(stepScale(SCALE_MAX, 1)).toBe(SCALE_MAX);
  });

  it('totals at the chosen scale', () => {
    const items = [item('A', 1, 200), item('B', 2, 50)];
    expect(scaledTotals(items, 1).calories).toBe(300);
    expect(scaledTotals(items, 0.5).calories).toBe(150);
    expect(scaledTotals(items, 2).calories).toBe(600);
  });
});

describe('drafts', () => {
  const saved: SavedMeal = {
    id: 'm1',
    name: 'Usual breakfast',
    items: [item('Oats'), item('Banana')],
    createdAt: '2026-09-20T00:00:00Z',
  };
  const other: SavedMeal = { ...saved, id: 'm2', name: 'Lunch' };

  it('starts empty for a new meal, and copies an existing one', () => {
    expect(emptyDraft()).toMatchObject({ id: null, name: '', items: [] });
    const d = draftFromMeal(saved);
    expect(d).toMatchObject({ id: 'm1', name: 'Usual breakfast' });
    expect(d.items).toEqual(saved.items);
    expect(d.items).not.toBe(saved.items);
  });

  it('knows whether anything changed', () => {
    const d = draftFromMeal(saved);
    expect(isDraftDirty(d)).toBe(false);
    expect(isDraftDirty({ ...d, name: '  Usual   breakfast ' })).toBe(false);
    expect(isDraftDirty({ ...d, name: 'Big breakfast' })).toBe(true);
    expect(isDraftDirty({ ...d, items: [...d.items, item('Coffee')] })).toBe(true);
    expect(isDraftDirty({ ...emptyDraft(), name: 'x' })).toBe(true);
  });

  it('validates the name, the items and clashes with other meals', () => {
    const d = draftFromMeal(saved);
    expect(validateDraft(d, [saved, other])).toBeNull();
    expect(validateDraft({ ...d, name: ' ' }, [saved])).toMatch(/name/i);
    expect(validateDraft({ ...d, items: [] }, [saved])).toMatch(/at least one/i);
    expect(validateDraft({ ...d, name: 'lunch' }, [saved, other])).toMatch(/already have/);
    expect(
      validateDraft({ ...emptyDraft(), name: 'Lunch', items: [item('X')] }, [other]),
    ).toMatch(/already have/);
    expect(
      validateDraft({ ...emptyDraft(), name: 'New', items: [item('X')] }, [saved, other]),
    ).toBeNull();
  });

  it('adds, removes and adjusts items without changing the original list', () => {
    const items = [item('A'), item('B')];
    expect(addItem(items, item('C')).map((i) => i.name)).toEqual(['A', 'B', 'C']);
    expect(removeItemAt(items, 0).map((i) => i.name)).toEqual(['B']);
    expect(stepItemServings(items, 1, 0.5)[1].servings).toBe(1.5);
    expect(stepItemServings(items, 1, -5)[1].servings).toBe(0.5);
    expect(items[1].servings).toBe(1);
  });

  it('stops adding at the item limit', () => {
    const full = Array.from({ length: MAX_MEAL_ITEMS }, (_, i) => item(`F${i}`));
    expect(addItem(full, item('one more'))).toHaveLength(MAX_MEAL_ITEMS);
  });
});
