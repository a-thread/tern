import { FoodSource } from '@/domain/food/models/foodSource';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { getProductPortions } from './openFoodFacts';
import {
  clearSizes,
  loadSizes,
  needsSizes,
  sizesKnown,
  sizesSettled,
  withSizes,
} from './foodSizes';

jest.mock('./openFoodFacts', () => ({
  getProductPortions: jest.fn(),
}));
const fetchProduct = jest.mocked(getProductPortions);

const food = (extra: Partial<SearchResult>): SearchResult => ({
  id: '0851087000687',
  name: 'Oatmeal',
  servingLabel: '100 g',
  calories: 371,
  protein: 8.6,
  carbs: 77,
  fat: 5.7,
  tier: 4,
  source: FoodSource.Off,
  ...extra,
});

describe('foodSizes', () => {
  beforeEach(() => {
    clearSizes();
    fetchProduct.mockReset();
  });

  it('wants sizes only for searched USDA and Open Food Facts foods that have none', () => {
    expect(needsSizes(food({}))).toBe(true);
    expect(needsSizes(food({ source: FoodSource.Usda }))).toBe(true);
    expect(
      needsSizes(food({ portions: [{ label: 'packet', grams: 35 }] })),
    ).toBe(false);
    expect(needsSizes(food({ last: { unit: null, quantity: 80 } }))).toBe(false);
    expect(needsSizes(food({ source: FoodSource.Common }))).toBe(false);
    expect(needsSizes(food({ source: undefined }))).toBe(false);
  });

  it('fetches once, shares the answer and fills it in', async () => {
    fetchProduct.mockResolvedValue({
      portions: [{ label: 'packet', grams: 35 }],
    });
    const oatmeal = food({});
    expect(sizesKnown(oatmeal)).toBe(false);
    await Promise.all([loadSizes(oatmeal), loadSizes(oatmeal)]);
    await loadSizes(oatmeal);
    expect(fetchProduct).toHaveBeenCalledTimes(1);
    expect(sizesKnown(oatmeal)).toBe(true);
    expect(withSizes(oatmeal).portions).toEqual([
      { label: 'packet', grams: 35 },
    ]);
  });

  it('remembers a food with no sizes, but not a failed request', async () => {
    fetchProduct.mockResolvedValueOnce({});
    const plain = food({ id: '1111111111111' });
    expect(await loadSizes(plain)).toBeNull();
    expect(sizesKnown(plain)).toBe(true);
    expect(withSizes(plain)).toBe(plain);

    fetchProduct.mockRejectedValueOnce(new Error('offline'));
    const offline = food({ id: '2222222222222' });
    expect(await loadSizes(offline)).toBeNull();
    expect(sizesKnown(offline)).toBe(false);
    // The list stops waiting on it; a later look asks again.
    expect(sizesSettled(offline)).toBe(true);
    fetchProduct.mockResolvedValueOnce({ portions: [{ label: 'bar', grams: 40 }] });
    await loadSizes(offline);
    expect(sizesKnown(offline)).toBe(true);
  });
});

describe('a food you logged before it had sizes', () => {
  beforeEach(() => {
    clearSizes();
    fetchProduct.mockReset();
  });

  // Logged as "2 oz" before its packet size was known: oz and lb only, and no barcode of its own.
  const logged = food({
    id: 'logged-oatmeal|key food',
    source: undefined,
    portions: [
      { label: 'oz', grams: 28.35 },
      { label: 'lb', grams: 453.6 },
    ],
    last: { unit: 'oz', quantity: 2 },
  });

  it('has nothing to fetch on its own', () => {
    expect(needsSizes(logged)).toBe(false);
  });

  it('fetches from its database copy, and puts the packet ahead of oz and lb', async () => {
    fetchProduct.mockResolvedValue({
      portions: [{ label: 'packet', grams: 35 }],
    });
    const linked = {
      ...logged,
      sizesFrom: { id: '0851087000687', source: FoodSource.Off },
    };
    expect(needsSizes(linked)).toBe(true);
    await loadSizes(linked);
    expect(fetchProduct).toHaveBeenCalledWith('0851087000687');
    expect(withSizes(linked).portions?.map((p) => p.label)).toEqual([
      'packet',
      'oz',
      'lb',
    ]);
  });
});
