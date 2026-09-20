import { isValidBarcode, productToResult, searchProducts, type OffProduct } from './openFoodFacts';

// Trimmed copies of real Open Food Facts responses.
const rolledOats: OffProduct = {
  code: '8901808003137',
  brands: ['Eco valley'],
  nova_group: 1,
  product_name: 'rolled oats',
  nutriments: {
    'carbohydrates_100g': 68.5,
    'energy-kcal_100g': 407,
    'fat_100g': 9.5,
    'proteins_100g': 11.8,
  },
};

describe('productToResult', () => {
  it('maps per-100 g nutrition, brand and NOVA group', () => {
    expect(productToResult(rolledOats)).toEqual({
      id: '8901808003137',
      name: 'rolled oats',
      brand: 'Eco valley',
      servingLabel: '100 g',
      calories: 407,
      protein: 11.8,
      carbs: 68.5,
      fat: 9.5,
      tier: 1,
      source: 'off',
    });
  });

  it('leaves the tier unknown when there is no NOVA group', () => {
    const noNova: OffProduct = { ...rolledOats };
    delete noNova.nova_group;
    expect(productToResult(noNova)?.tier).toBeNull();
    expect(productToResult({ ...rolledOats, nova_group: 7 })?.tier).toBeNull();
    expect(productToResult({ ...rolledOats, nova_group: '4' })?.tier).toBe(4);
  });

  it('keeps nutrition per 100 g and offers the declared serving as a portion', () => {
    const r = productToResult({ ...rolledOats, serving_size: '40 g', serving_quantity: '40' });
    expect(r).toMatchObject({ servingLabel: '100 g', calories: 407, protein: 11.8, carbs: 68.5, fat: 9.5 });
    expect(r?.portions).toEqual([{ label: '40 g', grams: 40 }]);
  });

  it('names an unlabelled serving, and has no portion without one', () => {
    expect(productToResult({ ...rolledOats, serving_quantity: 30 })?.portions).toEqual([{ label: 'serving', grams: 30 }]);
    expect(productToResult(rolledOats)?.portions).toBeUndefined();
  });

  it('ignores an absurd serving weight', () => {
    expect(productToResult({ ...rolledOats, serving_quantity: 50000 })?.portions).toBeUndefined();
    expect(productToResult({ ...rolledOats, serving_quantity: 0 })?.portions).toBeUndefined();
  });

  it('takes the first brand from a string, or from an array', () => {
    expect(productToResult({ ...rolledOats, brands: 'Ferrero, Nutella' })?.brand).toBe('Ferrero');
    expect(productToResult({ ...rolledOats, brands: [] })?.brand).toBeUndefined();
    expect(productToResult({ ...rolledOats, brands: '' })?.brand).toBeUndefined();
  });

  it('falls back to kilojoules when kcal is missing', () => {
    const r = productToResult({
      product_name: 'Thing',
      nutriments: { 'energy-kj_100g': 1000 },
    });
    expect(r?.calories).toBe(239);
  });

  it('drops products with no name or no usable calories', () => {
    expect(productToResult({ ...rolledOats, product_name: '  ' })).toBeNull();
    expect(productToResult({ product_name: 'Mystery', nutriments: {} })).toBeNull();
    expect(productToResult({ product_name: 'Bad data', nutriments: { 'energy-kcal_100g': 5000 } })).toBeNull();
  });

  it('treats missing macros as zero when calories are present', () => {
    const r = productToResult({ product_name: 'Sparse', nutriments: { 'energy-kcal_100g': 50 } });
    expect(r).toMatchObject({ calories: 50, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('isValidBarcode', () => {
  it('accepts 8 to 14 digits only', () => {
    expect(isValidBarcode('3017624010701')).toBe(true);
    expect(isValidBarcode(' 12345678 ')).toBe(true);
    expect(isValidBarcode('1234567')).toBe(false);
    expect(isValidBarcode('123456789012345')).toBe(false);
    expect(isValidBarcode('12345abc90')).toBe(false);
  });
});

describe('searchProducts', () => {
  const hit = (name: string) => ({
    code: name,
    product_name: name,
    nutriments: { 'energy-kcal_100g': 50 },
  });
  const respond = (hits: unknown[]) =>
    ({ ok: true, json: async () => ({ hits }) }) as Response;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => fetchMock.mockRestore());

  const queryOf = (call: number) =>
    decodeURIComponent(new URL(fetchMock.mock.calls[call][0] as string).searchParams.get('q') ?? '');

  it('asks for English-language products first', async () => {
    fetchMock.mockResolvedValueOnce(respond([hit('Apples')]));
    const r = await searchProducts('apple');
    expect(r.map((x) => x.name)).toEqual(['Apples']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(queryOf(0)).toBe('apple lang:en');
  });

  it('falls back to every language only when English finds nothing', async () => {
    fetchMock.mockResolvedValueOnce(respond([])).mockResolvedValueOnce(respond([hit('Baguette')]));
    const r = await searchProducts('baguette');
    expect(r.map((x) => x.name)).toEqual(['Baguette']);
    expect(queryOf(0)).toBe('baguette lang:en');
    expect(queryOf(1)).toBe('baguette');
  });

  it('keeps typed search syntax from changing the filter', async () => {
    fetchMock.mockResolvedValueOnce(respond([hit('X')]));
    await searchProducts('lang:fr "pomme" (x)');
    expect(queryOf(0)).toBe('lang fr pomme x lang:en');
  });

  it('does not search for text that is only syntax', async () => {
    expect(await searchProducts(' : " ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('searchProducts duplicates', () => {
  it('shows the same product once even when it has several barcodes', async () => {
    const dup = (code: string) => ({
      code,
      product_name: 'Apples',
      brands: 'Apple Country',
      nutriments: { 'energy-kcal_100g': 52 },
    });
    const spy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hits: [dup('1'), dup('2'), { ...dup('3'), nutriments: { 'energy-kcal_100g': 60 } }] }),
    } as Response);
    const r = await searchProducts('apples');
    spy.mockRestore();
    expect(r.map((x) => x.id)).toEqual(['1', '3']);
  });
});
