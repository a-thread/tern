import {
  getUsdaPortionsWithKey,
  measureToPortion,
  searchUsdaWithKey,
  usdaFoodToResult,
  usdaPortions,
  type UsdaFood,
} from './usda';
import { FoodSource } from '../models/foodSource';

// Portion values are real USDA "food details" data (apples, white rice, pita).
// The search-result shape is written from USDA's documentation; confirm it
// against a live response when a key is available.
const apple: UsdaFood = {
  fdcId: 171689,
  description: 'Apples, raw, without skin',
  foodNutrients: [
    { nutrientId: 1008, value: 48, unitName: 'KCAL' },
    { nutrientId: 1003, value: 0.27 },
    { nutrientId: 1004, value: 0.13 },
    { nutrientId: 1005, value: 13.6 },
  ],
  foodPortions: [
    {
      amount: 1,
      measureUnit: { name: 'undetermined' },
      modifier: 'large (3-1/4" dia)',
      gramWeight: 216,
    },
    {
      amount: 1,
      measureUnit: { name: 'undetermined' },
      modifier: 'cup slices',
      gramWeight: 110,
    },
    {
      amount: 1,
      measureUnit: { name: 'undetermined' },
      modifier: 'small (2-3/4" dia)',
      gramWeight: 132,
    },
    {
      amount: 1,
      measureUnit: { name: 'undetermined' },
      modifier: 'medium (3" dia)',
      gramWeight: 161,
    },
  ],
};

describe('usdaFoodToResult', () => {
  it('maps per-100 g nutrition and household portions', () => {
    expect(usdaFoodToResult(apple)).toEqual({
      id: 'usda-171689',
      name: 'Apples, raw, without skin',
      servingLabel: '100 g',
      calories: 48,
      protein: 0.3,
      carbs: 13.6,
      fat: 0.1,
      tier: null,
      source: FoodSource.Usda,
      portions: [
        { label: 'large (3-1/4" dia)', grams: 216 },
        { label: 'cup slices', grams: 110 },
        { label: 'small (2-3/4" dia)', grams: 132 },
        { label: 'medium (3" dia)', grams: 161 },
      ],
    });
  });

  it('uses foodMeasures from a search result the same way, in rank order', () => {
    const r = usdaFoodToResult({
      fdcId: 1,
      description: 'Rice, white, cooked',
      foodNutrients: [{ nutrientId: 1008, value: 130 }],
      foodMeasures: [
        { disseminationText: '1 cup', gramWeight: 158, rank: 2 },
        { disseminationText: '1 tbsp', gramWeight: 10, rank: 3 },
        {
          disseminationText: 'Quantity not specified',
          gramWeight: 100,
          rank: 1,
        },
      ],
    });
    // USDA's usual amount ("Quantity not specified") is kept as the serving, after the rest.
    expect(r?.portions).toEqual([
      { label: 'cup', grams: 158 },
      { label: 'tbsp', grams: 10 },
      { label: 'serving', grams: 100 },
    ]);
  });

  it('treats a slightly negative "by difference" carb figure as zero', () => {
    const lamb = usdaFoodToResult({
      fdcId: 2727570,
      description: 'Lamb, ground, raw',
      foodNutrients: [
        { nutrientId: 1008, value: 237 },
        { nutrientId: 1003, value: 17.5 },
        { nutrientId: 1005, value: -0.3 },
        { nutrientId: 1004, value: 18.6 },
      ],
    });
    expect(lamb).toMatchObject({ protein: 17.5, carbs: 0, fat: 18.6 });
  });

  it('falls back to Atwater energy, the older nutrient numbers, and kilojoules', () => {
    expect(
      usdaFoodToResult({
        fdcId: 2,
        description: 'Oats',
        foodNutrients: [{ nutrientId: 2047, value: 371 }],
      })?.calories,
    ).toBe(371);
    expect(
      usdaFoodToResult({
        fdcId: 3,
        description: 'Oats',
        foodNutrients: [{ nutrientNumber: '208', value: 380 }],
      })?.calories,
    ).toBe(380);
    expect(
      usdaFoodToResult({
        fdcId: 4,
        description: 'Oats',
        foodNutrients: [{ nutrientId: 1062, value: 1000 }],
      })?.calories,
    ).toBe(239);
  });

  it('leaves out portions when there are none, and drops duplicates', () => {
    const r = usdaFoodToResult({
      fdcId: 5,
      description: 'Thing',
      foodNutrients: [{ nutrientId: 1008, value: 100 }],
    });
    expect(r?.portions).toBeUndefined();
    const dup = usdaFoodToResult({
      fdcId: 6,
      description: 'Thing',
      foodNutrients: [{ nutrientId: 1008, value: 100 }],
      foodMeasures: [
        { disseminationText: 'cup', gramWeight: 100 },
        { disseminationText: 'Cup', gramWeight: 100 },
      ],
    });
    expect(dup?.portions).toHaveLength(1);
  });

  it('drops foods with no name, id or energy, or an impossible energy', () => {
    expect(
      usdaFoodToResult({
        fdcId: 7,
        description: ' ',
        foodNutrients: [{ nutrientId: 1008, value: 1 }],
      }),
    ).toBeNull();
    expect(
      usdaFoodToResult({
        description: 'No id',
        foodNutrients: [{ nutrientId: 1008, value: 1 }],
      }),
    ).toBeNull();
    expect(
      usdaFoodToResult({
        fdcId: 8,
        description: 'No energy',
        foodNutrients: [{ nutrientId: 1003, value: 5 }],
      }),
    ).toBeNull();
    expect(
      usdaFoodToResult({
        fdcId: 9,
        description: 'Bad',
        foodNutrients: [{ nutrientId: 1008, value: 5000 }],
      }),
    ).toBeNull();
  });
});

describe('measureToPortion', () => {
  it('completes a bare size with the food, so an egg is counted in eggs', () => {
    expect(
      measureToPortion({ disseminationText: '1 large', gramWeight: 50 }, 'egg'),
    ).toEqual({ label: 'large egg', grams: 50 });
    expect(
      measureToPortion({ disseminationText: '1 cup', gramWeight: 240 }, 'egg'),
    ).toEqual({ label: 'cup', grams: 240 });
    expect(
      measureToPortion({ disseminationText: '1 large', gramWeight: 50 }),
    ).toEqual({ label: 'large', grams: 50 });
  });

  it('turns "2 slices = 56 g" into one slice of 28 g', () => {
    expect(
      measureToPortion({ amount: 2, modifier: 'slice', gramWeight: 56 }),
    ).toEqual({ label: 'slice', grams: 28 });
  });

  it('uses the unit name when there is no modifier, unless it is a placeholder', () => {
    expect(
      measureToPortion({
        amount: 1,
        measureUnit: { name: 'cup' },
        gramWeight: 240,
      }),
    ).toEqual({ label: 'cup', grams: 240 });
    expect(
      measureToPortion({
        amount: 1,
        measureUnit: { name: 'undetermined' },
        gramWeight: 50,
      }),
    ).toBeNull();
  });

  it('rejects missing, zero or absurd weights', () => {
    expect(measureToPortion({ modifier: 'cup' })).toBeNull();
    expect(measureToPortion({ modifier: 'cup', gramWeight: 0 })).toBeNull();
    expect(measureToPortion({ modifier: 'cup', gramWeight: 99999 })).toBeNull();
  });
});

// Real USDA search-result data (Survey/FNDDS "Apple, raw"), captured live.
describe('real search-result shape', () => {
  const m = (
    disseminationText: string,
    gramWeight: number,
    modifier: string,
    rank: number,
  ) => ({
    disseminationText,
    gramWeight,
    modifier,
    rank,
    measureUnitName: 'undetermined',
  });
  const appleRaw: UsdaFood = {
    fdcId: 2709215,
    description: 'Apple, raw',
    foodNutrients: [
      { nutrientId: 1003, value: 0.17 },
      { nutrientId: 1004, value: 0.15 },
      { nutrientId: 1005, value: 14.8 },
      { nutrientId: 1008, value: 61 },
    ],
    foodMeasures: [
      m('1 small', 165, '62015', 1),
      m('1 single serving package', 34, '64236', 7),
      m('Quantity not specified', 200, '90000', 8),
      m('1 slice', 25, '61935', 5),
      m('1 medium', 200, '61238', 2),
      m('1 extra large', 295, '60749', 4),
      m('1 large', 242, '60919', 3),
      m('1 cup', 125, '10205', 6),
    ],
  };

  it('never shows the numeric modifier code, and uses the readable phrase in rank order', () => {
    const r = usdaFoodToResult(appleRaw);
    expect(r?.calories).toBe(61);
    expect(r?.portions).toEqual([
      { label: 'small apple', grams: 165 },
      { label: 'medium apple', grams: 200 },
      { label: 'large apple', grams: 242 },
      { label: 'extra large apple', grams: 295 },
      { label: 'slice', grams: 25 },
      { label: 'cup', grams: 125 },
      { label: 'single serving package', grams: 34 },
    ]);
    expect(r?.portions?.some((p) => /^\d+$/.test(p.label))).toBe(false);
  });

  it('reads quantities in the phrase, including fractions', () => {
    expect(measureToPortion(m('2 slices', 56, '1', 1))).toEqual({
      label: 'slices',
      grams: 28,
    });
    expect(measureToPortion(m('1/2 cup', 60, '1', 1))).toEqual({
      label: 'cup',
      grams: 120,
    });
    expect(measureToPortion(m('1 1/2 cups', 180, '1', 1))).toEqual({
      label: 'cups',
      grams: 120,
    });
    expect(measureToPortion(m('1 apple, any size', 320, '64730', 1))).toEqual({
      label: 'apple, any size',
      grams: 320,
    });
  });

  it('drops a portion that has only a code and no readable name', () => {
    expect(
      measureToPortion({
        modifier: '62015',
        gramWeight: 165,
        measureUnitName: 'undetermined',
      }),
    ).toBeNull();
  });
});

// Real data from live responses (November 2026): search measures and food details.
describe('portions that make sense to a person', () => {
  const food = (measures: UsdaFood['foodPortions'], description = 'Milk') =>
    usdaPortions({ fdcId: 1, description, foodPortions: measures });

  it('drops guideline amounts, cooked yields, cubic inches, drinks with ice and ounces', () => {
    expect(
      food([
        { disseminationText: '1 cup', gramWeight: 244, rank: 1 },
        {
          disseminationText: 'Guideline amount per fl oz of beverage',
          gramWeight: 2.5,
          rank: 2,
        },
        {
          disseminationText: 'Guideline amount per cup of hot cereal',
          gramWeight: 61,
          rank: 3,
        },
        { disseminationText: '1 oz yields', gramWeight: 20, rank: 4 },
        { disseminationText: '1 oz, cooked', gramWeight: 28.35, rank: 5 },
        { disseminationText: '1 cubic inch', gramWeight: 17, rank: 6 },
        { disseminationText: '1 fl oz (with ice)', gramWeight: 23, rank: 7 },
        { disseminationText: '1 fl oz (no ice)', gramWeight: 31, rank: 8 },
        { disseminationText: '1 fl oz (NFS)', gramWeight: 31, rank: 9 },
      ]),
    ).toEqual([
      { label: 'cup', grams: 244 },
      { label: 'fl oz', grams: 31 },
    ]);
  });

  it('joins a Foundation unit and how it is cut: "cup, chopped", "cup, shredded"', () => {
    expect(
      food(
        [
          {
            amount: 1,
            modifier: 'chopped',
            measureUnit: { name: 'cup' },
            gramWeight: 76,
            sequenceNumber: 1,
          },
          {
            amount: 1,
            portionDescription: 'shredded',
            measureUnit: { name: 'cup' },
            gramWeight: 105,
            sequenceNumber: 2,
          },
          {
            amount: 1,
            measureUnit: { name: 'slice' },
            gramWeight: 17,
            sequenceNumber: 3,
          },
        ],
        'Broccoli, raw',
      ),
    ).toEqual([
      { label: 'cup, chopped', grams: 76 },
      { label: 'cup, shredded', grams: 105 },
      { label: 'slice', grams: 17 },
    ]);
  });

  it('reads RACC, NLEA serving and "Quantity not specified" as one serving, last', () => {
    expect(
      food([
        { amount: 1, measureUnit: { name: 'RACC' }, gramWeight: 85 },
        {
          amount: 1,
          modifier: 'cup',
          measureUnit: { name: 'undetermined' },
          gramWeight: 194,
        },
        {
          amount: 1,
          modifier: 'NLEA serving',
          measureUnit: { name: 'undetermined' },
          gramWeight: 126,
        },
      ]),
    ).toEqual([
      { label: 'cup', grams: 194 },
      { label: 'serving', grams: 85 },
    ]);
  });

  it('leaves the serving out when another portion already weighs the same', () => {
    expect(
      food([
        { disseminationText: '1 breast, NS as to size', gramWeight: 130, rank: 1 },
        { disseminationText: 'Quantity not specified', gramWeight: 130, rank: 2 },
      ]),
    ).toEqual([{ label: 'breast', grams: 130 }]);
  });

  it('reads an SR Legacy "serving 2 oz" as the serving', () => {
    expect(
      food([
        {
          amount: 1,
          modifier: 'serving 2 oz',
          measureUnit: { name: 'undetermined' },
          gramWeight: 56,
        },
      ]),
    ).toEqual([{ label: 'serving', grams: 56 }]);
  });

  it('keeps the serving when it is all there is', () => {
    expect(
      food([{ disseminationText: 'Quantity not specified', gramWeight: 45 }]),
    ).toEqual([{ label: 'serving', grams: 45 }]);
  });
});

describe('getUsdaPortions', () => {
  afterEach(() => jest.restoreAllMocks());

  it("fetches a food's details by its id and returns their portions", async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        fdcId: 747447,
        description: 'Broccoli, raw',
        foodPortions: [
          {
            amount: 1,
            modifier: 'chopped',
            measureUnit: { name: 'cup' },
            gramWeight: 76,
          },
        ],
      }),
    } as Response);
    expect(await getUsdaPortionsWithKey('usda-747447', 'abc123')).toEqual([
      { label: 'cup, chopped', grams: 76 },
    ]);
    const [url] = spy.mock.calls[0] as [string];
    expect(url).toContain('/fdc/v1/food/747447?api_key=abc123');
  });

  it('asks for nothing without a key or for an id that is not USDA', async () => {
    const spy = jest.spyOn(global, 'fetch');
    expect(await getUsdaPortionsWithKey('usda-1', undefined)).toEqual([]);
    expect(await getUsdaPortionsWithKey('0851087000687', 'abc')).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('searchUsda request', () => {
  afterEach(() => jest.restoreAllMocks());

  it('posts the query as JSON, with the key in the URL only', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        foods: [
          {
            fdcId: 1,
            description: 'Chicken breast',
            foodNutrients: [{ nutrientId: 1008, value: 165 }],
          },
        ],
      }),
    } as Response);
    const r = await searchUsdaWithKey('  chicken breast ', 'abc123');
    expect(r.map((x) => x.name)).toEqual(['Chicken breast']);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('api_key=abc123');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      query: 'chicken breast',
      dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
      pageSize: 15,
    });
    expect(init.body).not.toContain('abc123');
  });

  it('asks for nothing when there is no key', async () => {
    const spy = jest.spyOn(global, 'fetch');
    expect(await searchUsdaWithKey('apple', undefined)).toEqual([]);
    expect(await searchUsdaWithKey('apple', '')).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('spoon names', () => {
  it('shortens tablespoon and teaspoon to the app’s tbsp and tsp', () => {
    expect(
      usdaPortions({
        fdcId: 1,
        description: 'Peanut butter',
        foodMeasures: [
          { disseminationText: '1 tablespoon', gramWeight: 16, rank: 1 },
          { disseminationText: '1 teaspoon', gramWeight: 5.3, rank: 2 },
        ],
      }),
    ).toEqual([
      { label: 'tbsp', grams: 16 },
      { label: 'tsp', grams: 5.3 },
    ]);
  });
});
