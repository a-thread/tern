import { Meal } from '@/domain/food/models/foodEntry';
import {
  batchItem,
  homemadeEntry,
  perServing,
  servingMeasure,
  typedServingGrams,
  type Homemade,
} from './homemade';

const chili: Homemade = {
  name: ' Chili ',
  serving: '1 bowl',
  makes: 8,
  servingGrams: null,
  totals: { calories: 2400, protein: 160, carbs: 200, fat: 96 },
  tier: 1,
};

describe('homemade', () => {
  it('shares a batch out per serving', () => {
    expect(perServing(chili)).toEqual({
      calories: 300,
      protein: 20,
      carbs: 25,
      fat: 12,
    });
    expect(perServing({ ...chili, makes: 1 }).calories).toBe(2400);
  });

  it('logs one serving, with the serving as typed', () => {
    expect(homemadeEntry(chili, Meal.Dinner)).toEqual({
      name: 'Chili',
      meal: Meal.Dinner,
      tier: 1,
      servings: 1,
      servingLabel: '1 bowl',
      calories: 300,
      protein: 20,
      carbs: 25,
      fat: 12,
    });
  });

  it('keeps the whole batch for a recipe', () => {
    expect(batchItem(chili)).toMatchObject({
      name: 'Chili',
      servings: 1,
      servingLabel: 'whole batch',
      calories: 2400,
    });
  });

  it('weighs a serving so it can be changed by weight or by the cup later', () => {
    const cups = { ...chili, serving: '2 cups', servingGrams: 300 };
    expect(servingMeasure(cups)).toMatchObject({
      portions: [{ label: 'cup', grams: 150 }],
      unit: 'cup',
      quantity: 2,
      per100: { calories: 100 },
    });
    expect(homemadeEntry(cups, Meal.Dinner)).toMatchObject({
      servingLabel: '2 cups (300 g)',
      calories: 300,
    });
    expect(servingMeasure(chili)).toBeNull();
  });

  it('reads a typed weight in its unit, as grams', () => {
    expect(typedServingGrams('12', 28.35)).toBe(340.2);
    expect(typedServingGrams('300', 1)).toBe(300);
    expect(typedServingGrams('', 1)).toBeNull();
    expect(typedServingGrams('0', 1)).toBeNull();
  });
});
