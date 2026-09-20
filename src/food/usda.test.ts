import { measureToPortion, searchUsdaWithKey, usdaFoodToResult, type UsdaFood } from './usda';

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
    { amount: 1, measureUnit: { name: 'undetermined' }, modifier: 'large (3-1/4" dia)', gramWeight: 216 },
    { amount: 1, measureUnit: { name: 'undetermined' }, modifier: 'cup slices', gramWeight: 110 },
    { amount: 1, measureUnit: { name: 'undetermined' }, modifier: 'small (2-3/4" dia)', gramWeight: 132 },
    { amount: 1, measureUnit: { name: 'undetermined' }, modifier: 'medium (3" dia)', gramWeight: 161 },
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
      source: 'usda',
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
        { disseminationText: 'Quantity not specified', gramWeight: 100, rank: 1 },
      ],
    });
    expect(r?.portions).toEqual([
      { label: 'cup', grams: 158 },
      { label: 'tbsp', grams: 10 },
    ]);
  });

  it('falls back to Atwater energy, the older nutrient numbers, and kilojoules', () => {
    expect(usdaFoodToResult({ fdcId: 2, description: 'Oats', foodNutrients: [{ nutrientId: 2047, value: 371 }] })?.calories).toBe(371);
    expect(usdaFoodToResult({ fdcId: 3, description: 'Oats', foodNutrients: [{ nutrientNumber: '208', value: 380 }] })?.calories).toBe(380);
    expect(usdaFoodToResult({ fdcId: 4, description: 'Oats', foodNutrients: [{ nutrientId: 1062, value: 1000 }] })?.calories).toBe(239);
  });

  it('leaves out portions when there are none, and drops duplicates', () => {
    const r = usdaFoodToResult({ fdcId: 5, description: 'Thing', foodNutrients: [{ nutrientId: 1008, value: 100 }] });
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
    expect(usdaFoodToResult({ fdcId: 7, description: ' ', foodNutrients: [{ nutrientId: 1008, value: 1 }] })).toBeNull();
    expect(usdaFoodToResult({ description: 'No id', foodNutrients: [{ nutrientId: 1008, value: 1 }] })).toBeNull();
    expect(usdaFoodToResult({ fdcId: 8, description: 'No energy', foodNutrients: [{ nutrientId: 1003, value: 5 }] })).toBeNull();
    expect(usdaFoodToResult({ fdcId: 9, description: 'Bad', foodNutrients: [{ nutrientId: 1008, value: 5000 }] })).toBeNull();
  });
});

describe('measureToPortion', () => {
  it('turns "2 slices = 56 g" into one slice of 28 g', () => {
    expect(measureToPortion({ amount: 2, modifier: 'slice', gramWeight: 56 })).toEqual({ label: 'slice', grams: 28 });
  });

  it('uses the unit name when there is no modifier, unless it is a placeholder', () => {
    expect(measureToPortion({ amount: 1, measureUnit: { name: 'cup' }, gramWeight: 240 })).toEqual({ label: 'cup', grams: 240 });
    expect(measureToPortion({ amount: 1, measureUnit: { name: 'undetermined' }, gramWeight: 50 })).toBeNull();
  });

  it('rejects missing, zero or absurd weights', () => {
    expect(measureToPortion({ modifier: 'cup' })).toBeNull();
    expect(measureToPortion({ modifier: 'cup', gramWeight: 0 })).toBeNull();
    expect(measureToPortion({ modifier: 'cup', gramWeight: 99999 })).toBeNull();
  });
});

// Real USDA search-result data (Survey/FNDDS "Apple, raw"), captured live.
describe('real search-result shape', () => {
  const m = (disseminationText: string, gramWeight: number, modifier: string, rank: number) => ({
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
      { label: 'small', grams: 165 },
      { label: 'medium', grams: 200 },
      { label: 'large', grams: 242 },
      { label: 'extra large', grams: 295 },
      { label: 'slice', grams: 25 },
      { label: 'cup', grams: 125 },
      { label: 'single serving package', grams: 34 },
    ]);
    expect(r?.portions?.some((p) => /^\d+$/.test(p.label))).toBe(false);
  });

  it('reads quantities in the phrase, including fractions', () => {
    expect(measureToPortion(m('2 slices', 56, '1', 1))).toEqual({ label: 'slices', grams: 28 });
    expect(measureToPortion(m('1/2 cup', 60, '1', 1))).toEqual({ label: 'cup', grams: 120 });
    expect(measureToPortion(m('1 1/2 cups', 180, '1', 1))).toEqual({ label: 'cups', grams: 120 });
    expect(measureToPortion(m('1 apple, any size', 320, '64730', 1))).toEqual({ label: 'apple, any size', grams: 320 });
  });

  it('drops a portion that has only a code and no readable name', () => {
    expect(measureToPortion({ modifier: '62015', gramWeight: 165, measureUnitName: 'undetermined' })).toBeNull();
  });
});

describe('searchUsda request', () => {
  afterEach(() => jest.restoreAllMocks());

  it('posts the query as JSON, with the key in the URL only', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foods: [{ fdcId: 1, description: 'Chicken breast', foodNutrients: [{ nutrientId: 1008, value: 165 }] }] }),
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
