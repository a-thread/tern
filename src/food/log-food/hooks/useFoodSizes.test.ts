import { act, renderHook } from '@testing-library/react-native';

import { FoodSource } from '@/domain/food/models/foodSource';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { clearSizes, loadSizes } from '../sources/foodSizes';
import { SizePrefetch, useListSizes } from './useFoodSizes';

jest.mock('../sources/foodSizes', () => {
  const actual = jest.requireActual('../sources/foodSizes');
  return { ...actual, loadSizes: jest.fn(actual.loadSizes) };
});
jest.mock('../sources/openFoodFacts', () => ({
  getProductPortions: jest.fn(async () => ({
    portions: [{ label: 'packet', grams: 35 }],
  })),
}));

const product = (n: number): SearchResult => ({
  id: String(1000000000000 + n),
  name: `Oatmeal ${n}`,
  servingLabel: '100 g',
  calories: 371,
  protein: 8.6,
  carbs: 77,
  fat: 5.7,
  tier: 4,
  source: FoodSource.Off,
});

describe('useListSizes', () => {
  beforeEach(() => {
    clearSizes();
    jest.mocked(loadSizes).mockClear();
  });

  it('fetches sizes for the top foods ahead of time and fills them in', async () => {
    const foods = Array.from({ length: SizePrefetch.TOP + 2 }, (_, i) =>
      product(i),
    );
    const { result } = renderHook(() => useListSizes(foods));
    await act(async () => {});
    // Only the top few are fetched.
    expect(loadSizes).toHaveBeenCalledTimes(SizePrefetch.TOP);
    expect(result.current[0].portions).toEqual([{ label: 'packet', grams: 35 }]);
    expect(result.current[SizePrefetch.TOP].portions).toBeUndefined();
  });
});
