import { FoodSource } from '@/domain/food/models/foodSource';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { getProductPortions } from './openFoodFacts';
import {
  clearSizes,
  loadSizes,
  needsSizes,
  sizesKnown,
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
  });
});
