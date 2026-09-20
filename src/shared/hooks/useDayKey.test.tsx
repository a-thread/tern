import React from 'react';
import { AppState } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';

import { dayKey } from '@shared/utils/date';
import { DayKeyProvider, useDayKey } from './useDayKey';

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('useDayKey', () => {
  it('returns today without a provider', () => {
    const { result } = renderHook(() => useDayKey());
    expect(result.current).toBe(dayKey());
  });

  // How many AppState listeners get registered by `consumers` calls of useDayKey.
  // (Compared between runs rather than against a fixed number, since the test
  // renderer may run effects more than once.)
  const listeners = (consumers: number, shared: boolean) => {
    const spy = jest.spyOn(AppState, 'addEventListener');
    const wrapper = shared
      ? ({ children }: { children: React.ReactNode }) => <DayKeyProvider>{children}</DayKeyProvider>
      : undefined;
    renderHook(() => Array.from({ length: consumers }, () => useDayKey()), { wrapper });
    const calls = spy.mock.calls.length;
    spy.mockRestore();
    return calls;
  };

  it('under a provider, more consumers cost no more listeners', () => {
    expect(listeners(1, true)).toBeGreaterThan(0);
    expect(listeners(6, true)).toBe(listeners(1, true));
  });

  it('without a provider, every consumer tracks its own', () => {
    expect(listeners(4, false)).toBeGreaterThan(listeners(1, false));
  });

  it('rolls over at midnight, for every consumer at once', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 20, 23, 59, 30));
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DayKeyProvider>{children}</DayKeyProvider>
    );
    const { result } = renderHook(() => [useDayKey(), useDayKey()], { wrapper });
    expect(result.current).toEqual(['2026-09-20', '2026-09-20']);

    act(() => {
      jest.setSystemTime(new Date(2026, 8, 21, 0, 0, 5));
      jest.advanceTimersByTime(40_000);
    });
    expect(result.current).toEqual(['2026-09-21', '2026-09-21']);
  });
});
