import React from 'react';
import { AppState } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';

import { dayKey } from '@shared/utils/date';
import { DayKeyProvider, useDayKey } from './useDayKey';

// Not restoreAllMocks: that would also wipe React Native's own AppState mock
// (a jest.fn), leaving addEventListener returning nothing for later tests.
afterEach(() => jest.useRealTimers());

describe('useDayKey', () => {
  it('returns today without a provider', () => {
    const { result } = renderHook(() => useDayKey());
    expect(result.current).toBe(dayKey());
  });

  // How many AppState listeners get registered by `consumers` calls of useDayKey.
  // (Compared between runs rather than against a fixed number, since the test
  // renderer may run effects more than once.) React Native's jest setup already
  // makes addEventListener a mock, so only its call count is cleared; restoring
  // it would drop the implementation that returns a subscription.
  const listeners = (consumers: number, shared: boolean) => {
    const mock = AppState.addEventListener as unknown as jest.Mock;
    mock.mockClear();
    const wrapper = shared
      ? ({ children }: { children: React.ReactNode }) => <DayKeyProvider>{children}</DayKeyProvider>
      : undefined;
    renderHook(() => Array.from({ length: consumers }, () => useDayKey()), { wrapper });
    return mock.mock.calls.length;
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
