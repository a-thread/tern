import { renderHook, act, waitFor } from '@testing-library/react-native';

import { FoodApiError } from './http';
import { searchProducts } from './openFoodFacts';
import { SEARCH_DEBOUNCE_MS, clearSearchCache, useFoodSearch } from './useFoodSearch';
import type { SearchResult } from './searchData';

jest.mock('./openFoodFacts', () => {
  const actual = jest.requireActual('./openFoodFacts');
  return { ...actual, searchProducts: jest.fn() };
});
const search = searchProducts as jest.MockedFunction<typeof searchProducts>;

const food = (name: string): SearchResult => ({
  id: name,
  name,
  servingLabel: '100 g',
  calories: 100,
  protein: 1,
  carbs: 1,
  fat: 1,
  tier: 1,
});

beforeEach(() => {
  jest.useFakeTimers();
  search.mockReset();
  clearSearchCache();
});
afterEach(() => jest.useRealTimers());

const type = async (ms = SEARCH_DEBOUNCE_MS) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe('useFoodSearch', () => {
  it('does nothing for an empty or one-character query', () => {
    const { result, rerender } = renderHook(({ q }) => useFoodSearch(q), { initialProps: { q: '' } });
    expect(result.current.state.status).toBe('idle');
    rerender({ q: 'o' });
    expect(result.current.state.status).toBe('idle');
    expect(search).not.toHaveBeenCalled();
  });

  it('waits for a pause in typing, then searches once', async () => {
    search.mockResolvedValue([food('Rolled oats')]);
    const { result, rerender } = renderHook(({ q }) => useFoodSearch(q), { initialProps: { q: 'ro' } });
    expect(result.current.state.status).toBe('loading');

    await type(SEARCH_DEBOUNCE_MS - 100);
    rerender({ q: 'rol' });
    await type(SEARCH_DEBOUNCE_MS - 100);
    expect(search).not.toHaveBeenCalled(); // still typing

    await type(200);
    await waitFor(() => expect(result.current.state.status).toBe('done'));
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toBe('rol');
  });

  it('does not search while disabled', async () => {
    const { result } = renderHook(() => useFoodSearch('oats', false));
    await type();
    expect(search).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('idle');
  });

  it('reports an error, and retries', async () => {
    search.mockRejectedValueOnce(new FoodApiError('network', 'down'));
    const { result } = renderHook(() => useFoodSearch('oats'));
    await type();
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', kind: 'network' }));

    search.mockResolvedValueOnce([food('Oats')]);
    act(() => result.current.retry());
    await type();
    await waitFor(() => expect(result.current.state.status).toBe('done'));
  });

  it('reuses a remembered search instead of asking again', async () => {
    search.mockResolvedValue([food('Oats')]);
    const first = renderHook(() => useFoodSearch('oats'));
    await type();
    await waitFor(() => expect(first.result.current.state.status).toBe('done'));
    first.unmount();

    const second = renderHook(() => useFoodSearch('Oats'));
    expect(second.result.current.state.status).toBe('done');
    expect(search).toHaveBeenCalledTimes(1);
  });
});
