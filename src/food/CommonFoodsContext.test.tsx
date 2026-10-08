import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';

import { commonFoodsSeed } from '@food/data/commonFoods.seed';
import type { CommonFoodsRepository } from '@food/data/commonFoods.repository';
import { COMMON_FOODS_KEY, CommonFoodsProvider, useCommonFoods } from './CommonFoodsContext';

const repo = (version: string | null): jest.Mocked<CommonFoodsRepository> => ({
  version: jest.fn(async () => version),
  loadAll: jest.fn(async () => commonFoodsSeed),
});

const setup = (r: CommonFoodsRepository) =>
  renderHook(() => useCommonFoods(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <CommonFoodsProvider repo={r}>{children}</CommonFoodsProvider>
    ),
  });

beforeEach(() => AsyncStorage.clear());

describe('CommonFoodsProvider', () => {
  it('downloads the list the first time and keeps a copy', async () => {
    const r = repo('v1');
    const { result } = setup(r);
    await waitFor(() => expect(result.current.version).toBe('v1'));
    expect(result.current.index.entries).toHaveLength(commonFoodsSeed.length);
    expect(r.loadAll).toHaveBeenCalledTimes(1);
    await waitFor(async () => expect(await AsyncStorage.getItem(COMMON_FOODS_KEY)).toContain('"v1"'));
  });

  it('uses the saved copy and does not download the same version again', async () => {
    await AsyncStorage.setItem(
      COMMON_FOODS_KEY,
      JSON.stringify({ version: 'v1', foods: commonFoodsSeed.slice(0, 3) }),
    );
    const r = repo('v1');
    const { result } = setup(r);
    await waitFor(() => expect(result.current.index.entries).toHaveLength(3));
    await waitFor(() => expect(r.version).toHaveBeenCalled());
    expect(r.loadAll).not.toHaveBeenCalled();
  });

  it('downloads again when the version changed', async () => {
    await AsyncStorage.setItem(
      COMMON_FOODS_KEY,
      JSON.stringify({ version: 'v1', foods: commonFoodsSeed.slice(0, 3) }),
    );
    const r = repo('v2');
    const { result } = setup(r);
    await waitFor(() => expect(result.current.version).toBe('v2'));
    expect(result.current.index.entries).toHaveLength(commonFoodsSeed.length);
  });

  it('keeps the saved copy when the backend cannot be reached', async () => {
    await AsyncStorage.setItem(
      COMMON_FOODS_KEY,
      JSON.stringify({ version: 'v1', foods: commonFoodsSeed.slice(0, 3) }),
    );
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const r: CommonFoodsRepository = {
      version: jest.fn(async () => {
        throw new Error('offline');
      }),
      loadAll: jest.fn(),
    };
    const { result } = setup(r);
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current.index.entries).toHaveLength(3);
    warn.mockRestore();
  });
});
