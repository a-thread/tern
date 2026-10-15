import { act, renderHook } from '@testing-library/react-native';

import { searchProducts } from '../../sources/openFoodFacts';
import { isUsdaEnabled, searchUsda } from '@/domain/food/sources/usda';
import { FoodApiError } from '@/domain/food/sources/http';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { commonFoodsSeed } from '@/domain/common-foods/commonFoods.seed';
import { buildCommonIndex } from '@/domain/common-foods/models/commonFoods';
import { clearSearchCache, FoodSearch } from './useFoodSearch';
import { useFoodLookup } from './useFoodLookup';
import { FoodSource } from '@/domain/food/models/foodSource';

jest.mock('../../sources/openFoodFacts', () => ({
  ...jest.requireActual('../../sources/openFoodFacts'),
  searchProducts: jest.fn(),
}));
jest.mock('@/domain/food/sources/usda', () => ({
  ...jest.requireActual('@/domain/food/sources/usda'),
  searchUsda: jest.fn(),
  isUsdaEnabled: jest.fn(),
}));
jest.mock('@shared/hooks/useDayKey', () => ({
  useDayKey: () => '2026-10-07',
}));
jest.mock('@/domain/saved-meals/SavedMealsContext', () => ({
  useSavedMeals: () => ({ meals: [] }),
}));
jest.mock('../../hooks/useLoggedFoods', () => ({
  useLoggedFoods: () => mockLogged,
}));
// Read lazily inside the mock, so it is set by the time the hook runs.
const mockIndex = buildCommonIndex(commonFoodsSeed);
jest.mock('@/domain/common-foods/CommonFoodsContext', () => ({
  useCommonFoods: () => ({ index: mockIndex, version: 'seed' }),
}));

const off = searchProducts as jest.MockedFunction<typeof searchProducts>;
const usda = searchUsda as jest.MockedFunction<typeof searchUsda>;
const usdaOn = isUsdaEnabled as jest.MockedFunction<typeof isUsdaEnabled>;

const food = (
  name: string,
  extra: Partial<SearchResult> = {},
): SearchResult => ({
  id: extra.id ?? name,
  name,
  servingLabel: '100 g',
  calories: 200,
  protein: 5,
  carbs: 20,
  fat: 8,
  tier: null,
  ...extra,
});

let mockLogged: { mine: SearchResult[]; recent: SearchResult[]; meals: [] } = {
  mine: [],
  recent: [],
  meals: [],
};

const deferred = () => {
  let resolve: (r: SearchResult[]) => void = () => {};
  let reject: (e: unknown) => void = () => {};
  const promise = new Promise<SearchResult[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const lookup = (initial: string) =>
  renderHook(
    ({ q }: { q: string }) =>
      useFoodLookup({
        query: q,
        filter: 'All',
        pickMode: false,
        meal: 'lunch',
      }),
    {
      initialProps: { q: initial },
    },
  );

const pause = async () => {
  await act(async () => {
    jest.advanceTimersByTime(FoodSearch.DEBOUNCE_MS);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  clearSearchCache();
  off.mockReset();
  usda.mockReset();
  usda.mockResolvedValue([]);
  usdaOn.mockReturnValue(true);
  mockLogged = { mine: [], recent: [], meals: [] };
});
afterEach(() => jest.useRealTimers());

describe('useFoodLookup', () => {
  it('shows your foods and common foods at once, before any request', () => {
    mockLogged.mine = [food('Egg salad sandwich', { id: 'logged-egg-salad' })];
    const { result } = lookup('egg');
    expect(result.current.foods.map((f) => f.name)).toEqual(
      expect.arrayContaining(['Egg', 'Egg salad sandwich']),
    );
    expect(result.current.foods[0].name).toBe('Egg');
    expect(result.current.pending).toBe(false);
    expect(result.current.nothingFound).toBe(false);
    expect(off).not.toHaveBeenCalled();
  });

  it('folds packaged results in after the pause without moving the rows on screen', async () => {
    const pending = deferred();
    off.mockReturnValueOnce(pending.promise);
    const { result } = lookup('egg');
    const before = result.current.foods.map((f) => f.id);

    await pause();
    expect(result.current.pending).toBe(true);
    await act(async () =>
      pending.resolve([food('Egg bites', { id: 'off-1', brand: 'Starbucks' })]),
    );

    const after = result.current.foods.map((f) => f.id);
    expect(result.current.pending).toBe(false);
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after).toContain('off-1');
    expect(result.current.foods.find((f) => f.id === 'off-1')?.from).toBe(
      FoodSource.Off,
    );
  });

  it('only asks USDA when the phone has fewer than three matches', async () => {
    off.mockResolvedValue([]);
    usda.mockResolvedValue([
      food('Quinoa, cooked', { id: 'usda-1', source: FoodSource.Usda }),
    ]);

    lookup('egg'); // several common matches
    await pause();
    expect(usda).not.toHaveBeenCalled();

    const rare = lookup('quinoa');
    await pause();
    expect(usda).toHaveBeenCalledWith('quinoa', expect.anything());
    expect(rare.result.current.foods.map((f) => f.id)).toContain('usda-1');
  });

  it('keeps the last packaged results, narrowed, while the next search runs', async () => {
    off.mockResolvedValueOnce([
      food('Oat milk', { id: 'off-oat-milk', brand: 'Oatly' }),
      food('Oat bar', { id: 'off-oat-bar', brand: 'X' }),
    ]);
    const { result, rerender } = lookup('oat');
    await pause();
    expect(result.current.foods.map((f) => f.id)).toContain('off-oat-milk');

    off.mockReturnValueOnce(deferred().promise);
    rerender({ q: 'oat mil' });
    const ids = result.current.foods.map((f) => f.id);
    expect(ids).toContain('off-oat-milk');
    expect(ids).not.toContain('off-oat-bar');
  });

  it('says nothing matched only once every source has answered', async () => {
    usdaOn.mockReturnValue(false);
    off.mockResolvedValue([]);
    const { result } = lookup('zzzz');
    expect(result.current.nothingFound).toBe(false); // still waiting to ask
    await pause();
    expect(result.current.nothingFound).toBe(true);
  });

  it('keeps what it found when a source fails, and offers a retry', async () => {
    usdaOn.mockReturnValue(false);
    off.mockRejectedValueOnce(new FoodApiError('network', 'down'));
    const { result } = lookup('egg');
    await pause();
    expect(result.current.failedLabels).toEqual(['packaged foods']);
    expect(result.current.foods[0].name).toBe('Egg');
    expect(result.current.nothingFound).toBe(false);
  });
});
