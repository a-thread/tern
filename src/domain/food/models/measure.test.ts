import { Units } from '@shared/utils/units';
import type { SearchResult } from '../sources/searchResult';
import {
  addPortions,
  amountOf,
  amountText,
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
  typedAmount,
  withTypedUnits,
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
    expect(a).toMatchObject({
      servings: 1,
      servingLabel: '2 large eggs (100 g)',
      calories: 143,
      protein: 12.6,
      fat: 9.5,
    });
    expect(a.measure).toBe(egg);
    expect(amountOf({ ...egg, quantity: 3 }).calories).toBe(215);
  });

  it('steps eggs by a half, cups by a quarter, or grams by ten', () => {
    expect(stepMeasure(egg, 1).quantity).toBe(2.5);
    expect(stepMeasure({ ...egg, quantity: 0.5 }, -1).quantity).toBe(0.5);
    // An older quarter amount lands back on the half-step grid.
    expect(stepMeasure({ ...egg, quantity: 0.25 }, 1).quantity).toBe(1);
    expect(stepMeasure({ ...egg, unit: 'cup', quantity: 1 }, 1).quantity).toBe(
      1.25,
    );
    expect(stepMeasure({ ...egg, unit: null, quantity: 100 }, 1).quantity).toBe(
      110,
    );
    expect(stepMeasure({ ...egg, unit: null, quantity: 8 }, -1).quantity).toBe(
      5,
    );
  });

  it('keeps the weight when the unit changes', () => {
    expect(switchUnit(egg, null)).toMatchObject({ unit: null, quantity: 100 });
    expect(
      switchUnit({ ...egg, unit: null, quantity: 125 }, 'large egg'),
    ).toMatchObject({ unit: 'large egg', quantity: 2.5 });
    expect(switchUnit(egg, 'cup')).toMatchObject({
      unit: 'cup',
      quantity: 0.5,
    });
    expect(switchUnit(egg, 'large egg')).toBe(egg);
  });

  it('scales an amount, and reads a typed weight (zero until it is usable)', () => {
    expect(scaleMeasure(egg, 0.5).quantity).toBe(1);
    expect(typedAmount(egg, '75')).toMatchObject({ unit: null, quantity: 75 });
    expect(typedAmount(egg, '').quantity).toBe(0);
    expect(typedAmount(egg, '0').quantity).toBe(0);
  });

  it('shows a quantity alone for a stepper', () => {
    expect(quantityText(egg)).toBe('2');
    expect(quantityText({ ...egg, unit: null, quantity: 150 })).toBe('150 g');
  });
});

describe('measuring a drink by volume', () => {
  // Whole milk, per 100 g; a cup weighs 244 g, so a ml is 1.031 g.
  const milk: Measure = {
    per100: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    portions: [
      { label: 'cup', grams: 244 },
      { label: 'fl oz', grams: 30.5 },
      { label: 'ml', grams: 1.031 },
    ],
    unit: 'ml',
    quantity: 250,
  };

  it('weighs and labels an amount in ml or fl oz', () => {
    expect(measureGrams(milk)).toBe(257.8);
    expect(measureLabel(milk)).toBe('250 ml (257.8 g)');
    expect(measureLabel({ ...milk, unit: 'fl oz', quantity: 8 })).toBe(
      '8 fl oz (244 g)',
    );
    expect(quantityText(milk)).toBe('250 ml');
    expect(quantityText({ ...milk, unit: 'fl oz', quantity: 8 })).toBe(
      '8 fl oz',
    );
  });

  it('works out nutrition from the volume', () => {
    expect(amountOf(milk)).toMatchObject({ calories: 157 });
  });

  it('switches between a cup, fl oz and whole ml', () => {
    const cup = { ...milk, unit: 'cup', quantity: 1 };
    expect(switchUnit(cup, 'fl oz')).toMatchObject({ quantity: 8 });
    expect(switchUnit(cup, 'ml')).toMatchObject({ quantity: 237 });
    expect(switchUnit(milk, null)).toMatchObject({ unit: null, quantity: 258 });
  });

  it('steps ten ml or a fluid ounce at a time', () => {
    expect(stepMeasure(milk, 1).quantity).toBe(260);
    expect(stepMeasure({ ...milk, quantity: 8 }, -1).quantity).toBe(5);
    const flOz = { ...milk, unit: 'fl oz', quantity: 8 };
    expect(stepMeasure(flOz, 1).quantity).toBe(9);
    expect(stepMeasure({ ...flOz, quantity: 1 }, -1).quantity).toBe(0.5);
  });

  it('keeps a typed amount in the volume unit chosen', () => {
    expect(typedAmount(milk, '330')).toMatchObject({
      unit: 'ml',
      quantity: 330,
    });
    expect(typedAmount({ ...milk, unit: 'cup' }, '330')).toMatchObject({
      unit: null,
    });
  });

  it('offers fl oz and ml on a drink logged before they existed', () => {
    const old = { ...milk, portions: [milk.portions[0]], unit: 'cup' };
    expect(withTypedUnits(old, 'Milk').portions.map((p) => p.label)).toEqual([
      'cup',
      'fl oz',
      'ml',
      'oz',
      'lb',
    ]);
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
    expect(startingMeasure(result, 100, Units.Metric)).toMatchObject({
      unit: 'large egg',
      quantity: 1,
      per100: { calories: 143 },
    });
  });

  it('starts from what you had last time, in the unit you used', () => {
    expect(
      startingMeasure(
        { ...result, last: { unit: 'large egg', quantity: 3 } },
        100,
        Units.Metric,
      ),
    ).toMatchObject({ unit: 'large egg', quantity: 3 });
    expect(
      startingMeasure(
        { ...result, last: { unit: null, quantity: 80 } },
        100,
        Units.Metric,
      ),
    ).toMatchObject({ unit: null, quantity: 80 });
    // A unit the food no longer offers falls back to the first portion.
    expect(
      startingMeasure(
        { ...result, last: { unit: 'jumbo egg', quantity: 3 } },
        100,
        Units.Metric,
      ),
    ).toMatchObject({ unit: 'large egg', quantity: 1 });
  });

  it('starts in grams when there are no portions', () => {
    expect(
      startingMeasure({ ...result, portions: undefined }, 100, Units.Metric),
    ).toMatchObject({ unit: null, quantity: 100 });
  });

  it('starts a drink in its own portion, or in ml when it has none', () => {
    const juice: SearchResult = {
      ...result,
      name: 'Orange juice',
      calories: 45,
      portions: [{ label: 'cup', grams: 248 }],
    };
    const m = startingMeasure(juice, 100, Units.Metric);
    expect(m.unit).toBe('cup');
    expect(m.portions.map((p) => p.label)).toEqual([
      'cup',
      'fl oz',
      'ml',
      'oz',
      'lb',
    ]);
    expect(
      startingMeasure(
        {
          ...juice,
          name: 'Sparkling water',
          portions: undefined,
          liquid: true,
        },
        100,
        Units.Metric,
      ),
    ).toMatchObject({ unit: 'ml', quantity: 100 });
  });

  it('converts values given for another weight to per 100 g', () => {
    const logged: SearchResult = {
      ...result,
      servingLabel: '40 g',
      calories: 60,
      portions: undefined,
    };
    expect(startingMeasure(logged, 40, Units.Metric)).toMatchObject({
      per100: { calories: 150 },
      quantity: 40,
    });
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
    expect(
      parseMeasure({ ...egg, per100: { calories: 'lots' } }),
    ).toBeUndefined();
  });

  it('drops portions that are not usable but keeps the rest', () => {
    const m = parseMeasure({
      ...egg,
      portions: [
        ...egg.portions,
        { label: 5, grams: 1 },
        { label: 'x', grams: 0 },
      ],
    });
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

describe('measuring by ounces and pounds', () => {
  const withWeight: Measure = {
    ...egg,
    portions: [
      ...egg.portions,
      { label: 'oz', grams: 28.35 },
      { label: 'lb', grams: 453.6 },
    ],
  };
  const grams: Measure = { ...withWeight, unit: null, quantity: 170 };

  it('weighs and labels an amount in oz or lb', () => {
    const oz = { ...withWeight, unit: 'oz', quantity: 6 };
    expect(measureGrams(oz)).toBe(170.1);
    expect(measureLabel(oz)).toBe('6 oz (170.1 g)');
    expect(quantityText(oz)).toBe('6 oz');
    expect(measureLabel({ ...withWeight, unit: 'lb', quantity: 1.5 })).toBe(
      '1.5 lb (680.4 g)',
    );
  });

  it('types in oz and lb, keeping the unit', () => {
    const oz = { ...withWeight, unit: 'oz', quantity: 1 };
    expect(typedAmount(oz, '6.25')).toMatchObject({
      unit: 'oz',
      quantity: 6.3,
    });
    expect(typedAmount({ ...oz, unit: 'lb' }, '2,5')).toMatchObject({
      unit: 'lb',
      quantity: 2.5,
    });
    expect(typedAmount(oz, '').quantity).toBe(0);
  });

  it('caps a typed amount at 5000 g in each unit', () => {
    const oz = { ...withWeight, unit: 'oz', quantity: 1 };
    expect(typedAmount(oz, '176').quantity).toBe(176);
    expect(typedAmount(oz, '177').quantity).toBe(0);
    const lb = { ...oz, unit: 'lb' };
    expect(typedAmount(lb, '11').quantity).toBe(11);
    expect(typedAmount(lb, '11.1').quantity).toBe(0);
    expect(typedAmount(grams, '5000').quantity).toBe(5000);
    expect(typedAmount(grams, '5001').quantity).toBe(0);
  });

  it('switches g → lb → g and g → oz → g without drifting far', () => {
    const lb = switchUnit(grams, 'lb');
    expect(lb).toMatchObject({ unit: 'lb', quantity: 0.37 });
    expect(measureGrams(switchUnit(lb, null))).toBeCloseTo(170, -1);
    const oz = switchUnit(grams, 'oz');
    expect(oz).toMatchObject({ unit: 'oz', quantity: 6 });
    expect(switchUnit(oz, null)).toMatchObject({ unit: null, quantity: 170 });
  });

  it('does not snap oz and lb to quarters', () => {
    expect(switchUnit({ ...grams, quantity: 100 }, 'oz').quantity).toBe(3.5);
  });

  it('steps an ounce or a quarter pound at a time', () => {
    const oz = { ...withWeight, unit: 'oz', quantity: 6 };
    expect(stepMeasure(oz, 1).quantity).toBe(7);
    expect(stepMeasure({ ...oz, quantity: 1 }, -1).quantity).toBe(0.5);
    const lb = { ...oz, unit: 'lb', quantity: 1 };
    expect(stepMeasure(lb, 1).quantity).toBe(1.25);
    expect(stepMeasure({ ...lb, quantity: 0.25 }, -1).quantity).toBe(0.25);
  });

  it('survives storage', () => {
    const oz = { ...withWeight, unit: 'oz', quantity: 6 };
    expect(parseMeasure(JSON.parse(JSON.stringify(oz)))).toEqual(oz);
  });

  it('gives an old entry oz and lb, once', () => {
    const old = withTypedUnits(egg, 'Egg');
    expect(old.portions.map((p) => p.label)).toEqual([
      'large egg',
      'cup',
      'oz',
      'lb',
    ]);
    expect(withTypedUnits(old, 'Egg')).toBe(old);
  });

  it('starts in oz for Imperial and grams for Metric when nothing else says', () => {
    const result: SearchResult = {
      id: 'off-1',
      name: 'Hummus',
      servingLabel: '100 g',
      calories: 166,
      protein: 8,
      carbs: 14,
      fat: 10,
      tier: null,
    };
    expect(startingMeasure(result, 100, Units.Imperial)).toMatchObject({
      unit: 'oz',
      quantity: 3.5,
    });
    expect(startingMeasure(result, 100, Units.Metric)).toMatchObject({
      unit: null,
      quantity: 100,
    });
    // A household portion still comes first.
    expect(
      startingMeasure(
        { ...result, portions: [{ label: 'tbsp', grams: 15 }] },
        100,
        Units.Imperial,
      ),
    ).toMatchObject({ unit: 'tbsp', quantity: 1 });
  });
});

describe('addPortions', () => {
  const m: Measure = {
    per100: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
    portions: [{ label: 'oz', grams: 28.35 }],
    unit: 'oz',
    quantity: 3,
  };

  it('offers sizes that arrived later first, keeping the amount chosen', () => {
    expect(
      addPortions(m, [
        { label: 'cup, chopped', grams: 76 },
        { label: 'oz', grams: 28.35 },
      ]),
    ).toEqual({
      ...m,
      portions: [
        { label: 'cup, chopped', grams: 76 },
        { label: 'oz', grams: 28.35 },
      ],
    });
  });

  it('returns the same measure when nothing is new', () => {
    expect(addPortions(m, [{ label: 'oz', grams: 28.35 }])).toBe(m);
  });
});

describe('amountText', () => {
  it('names the amount with its unit', () => {
    expect(amountText({ ...egg, quantity: 2 })).toBe('2 large eggs');
    expect(amountText({ ...egg, quantity: 1 })).toBe('1 large egg');
    expect(amountText({ ...egg, unit: null, quantity: 150 })).toBe('150 g');
    expect(
      amountText({
        ...egg,
        portions: [{ label: 'cup, chopped', grams: 76 }],
        unit: 'cup, chopped',
        quantity: 2,
      }),
    ).toBe('2 cups, chopped');
  });
});
