import type { SearchResult } from '@food/data/sources/searchResult';
import {
  amountOf,
  measureGrams,
  measureLabel,
  nounFor,
  parseMeasure,
  pluralize,
  quantityText,
  scaleMeasure,
  singular,
  startingMeasure,
  stepMeasure,
  switchUnit,
  typedGrams,
  type Measure,
} from './measure';

// Whole raw egg, per 100 g (USDA), and a large one weighs 50 g.
const egg: Measure = {
  per100: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  portions: [
    { label: 'large egg', grams: 50 },
    { label: 'cup', grams: 243 },
  ],
  unit: 'large egg',
  quantity: 2,
};

describe('measure', () => {
  it('weighs an amount in its own unit', () => {
    expect(measureGrams(egg)).toBe(100);
    expect(measureGrams({ ...egg, unit: null, quantity: 120 })).toBe(120);
  });

  it('labels what was eaten in eggs, with its weight', () => {
    expect(measureLabel(egg)).toBe('2 large eggs (100 g)');
    expect(measureLabel({ ...egg, quantity: 1 })).toBe('1 large egg (50 g)');
    expect(measureLabel({ ...egg, unit: null, quantity: 120 })).toBe('120 g');
  });

  it('turns an amount into one serving of exactly that, keeping the measure', () => {
    const a = amountOf(egg);
    expect(a).toMatchObject({ servings: 1, servingLabel: '2 large eggs (100 g)', calories: 143, protein: 12.6, fat: 9.5 });
    expect(a.measure).toBe(egg);
    expect(amountOf({ ...egg, quantity: 3 }).calories).toBe(215);
  });

  it('steps by a quarter portion, or ten grams', () => {
    expect(stepMeasure(egg, 1).quantity).toBe(2.25);
    expect(stepMeasure({ ...egg, quantity: 0.25 }, -1).quantity).toBe(0.25);
    expect(stepMeasure({ ...egg, unit: null, quantity: 100 }, 1).quantity).toBe(110);
    expect(stepMeasure({ ...egg, unit: null, quantity: 8 }, -1).quantity).toBe(5);
  });

  it('keeps the weight when the unit changes', () => {
    expect(switchUnit(egg, null)).toMatchObject({ unit: null, quantity: 100 });
    expect(switchUnit({ ...egg, unit: null, quantity: 125 }, 'large egg')).toMatchObject({ unit: 'large egg', quantity: 2.5 });
    expect(switchUnit(egg, 'cup')).toMatchObject({ unit: 'cup', quantity: 0.5 });
    expect(switchUnit(egg, 'large egg')).toBe(egg);
  });

  it('scales an amount, and reads a typed weight (zero until it is usable)', () => {
    expect(scaleMeasure(egg, 0.5).quantity).toBe(1);
    expect(typedGrams(egg, '75')).toMatchObject({ unit: null, quantity: 75 });
    expect(typedGrams(egg, '').quantity).toBe(0);
    expect(typedGrams(egg, '0').quantity).toBe(0);
  });

  it('shows a quantity alone for a stepper', () => {
    expect(quantityText(egg)).toBe('2');
    expect(quantityText({ ...egg, unit: null, quantity: 150 })).toBe('150 g');
  });
});

describe('startingMeasure', () => {
  const result: SearchResult = {
    id: 'usda-1',
    name: 'Egg, whole, raw',
    servingLabel: '100 g',
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    tier: null,
    portions: egg.portions,
  };

  it('starts with one of the first portion', () => {
    expect(startingMeasure(result, 100)).toMatchObject({ unit: 'large egg', quantity: 1, per100: { calories: 143 } });
  });

  it('starts from what you had last time, in the unit you used', () => {
    expect(startingMeasure({ ...result, last: { unit: 'large egg', quantity: 3 } }, 100)).toMatchObject({ unit: 'large egg', quantity: 3 });
    expect(startingMeasure({ ...result, last: { unit: null, quantity: 80 } }, 100)).toMatchObject({ unit: null, quantity: 80 });
    // A unit the food no longer offers falls back to the first portion.
    expect(startingMeasure({ ...result, last: { unit: 'jumbo egg', quantity: 3 } }, 100)).toMatchObject({ unit: 'large egg', quantity: 1 });
  });

  it('starts in grams when there are no portions', () => {
    expect(startingMeasure({ ...result, portions: undefined }, 100)).toMatchObject({ unit: null, quantity: 100 });
  });

  it('converts values given for another weight to per 100 g', () => {
    const logged: SearchResult = { ...result, servingLabel: '40 g', calories: 60, portions: undefined };
    expect(startingMeasure(logged, 40)).toMatchObject({ per100: { calories: 150 }, quantity: 40 });
  });
});

describe('parseMeasure', () => {
  it('accepts what was stored', () => {
    expect(parseMeasure(JSON.parse(JSON.stringify(egg)))).toEqual(egg);
  });

  it('refuses anything unusable, so an older or damaged entry just has no measure', () => {
    expect(parseMeasure(null)).toBeUndefined();
    expect(parseMeasure({})).toBeUndefined();
    expect(parseMeasure({ ...egg, quantity: 0 })).toBeUndefined();
    expect(parseMeasure({ ...egg, unit: 'jumbo egg' })).toBeUndefined();
    expect(parseMeasure({ ...egg, per100: { calories: 'lots' } })).toBeUndefined();
  });

  it('drops portions that are not usable but keeps the rest', () => {
    const m = parseMeasure({ ...egg, portions: [...egg.portions, { label: 5, grams: 1 }, { label: 'x', grams: 0 }] });
    expect(m?.portions).toEqual(egg.portions);
  });
});

describe('wording', () => {
  it('pluralizes a unit unless it is one, a measure abbreviation, or not plain words', () => {
    expect(pluralize('large egg', 2)).toBe('large eggs');
    expect(pluralize('large egg', 1)).toBe('large egg');
    expect(pluralize('slice', 0.5)).toBe('slices');
    expect(pluralize('berry', 2)).toBe('berries');
    expect(pluralize('dish', 2)).toBe('dishes');
    expect(pluralize('tbsp', 2)).toBe('tbsp');
    expect(pluralize('medium (3" dia)', 2)).toBe('medium (3" dia)');
  });

  it('singularizes the common cases', () => {
    expect(singular('eggs')).toBe('egg');
    expect(singular('tomatoes')).toBe('tomato');
    expect(singular('berries')).toBe('berry');
    expect(singular('candies')).toBe('candy');
    expect(singular('cookies')).toBe('cookie');
    expect(singular('pies')).toBe('pie');
    expect(singular('peaches')).toBe('peach');
    expect(singular('rice')).toBe('rice');
    expect(singular('glass')).toBe('glass');
  });

  it('takes a noun from a USDA food name', () => {
    expect(nounFor('Egg, whole, raw, fresh')).toBe('egg');
    expect(nounFor('Apples, raw, with skin')).toBe('apple');
    expect(nounFor('Sweet potato, raw')).toBe('sweet potato');
    expect(nounFor('Chicken breast meat only, cooked')).toBeNull();
    expect(nounFor('')).toBeNull();
  });
});
