import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { addDays, dayKey } from '@shared/utils/date';
import { ViewedDayProvider, useViewedDay } from './ViewedDayContext';

const today = dayKey();

function setup() {
  let onChange: ((state: AppStateStatus) => void) | undefined;
  const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    onChange = handler as (state: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  const hook = renderHook(() => useViewedDay(), {
    wrapper: ({ children }) => <ViewedDayProvider>{children}</ViewedDayProvider>,
  });
  return { ...hook, appState: (s: AppStateStatus) => act(() => onChange?.(s)), spy };
}

afterEach(() => jest.restoreAllMocks());

describe('ViewedDayProvider', () => {
  it('starts on today, which can be edited', () => {
    const { result } = setup();
    expect(result.current).toMatchObject({ day: today, today, isToday: true, editable: true });
  });

  it('views yesterday, which can still be edited', () => {
    const { result } = setup();
    act(() => result.current.setDay(addDays(today, -1)));
    expect(result.current).toMatchObject({ day: addDays(today, -1), isToday: false, editable: true });
  });

  it('views an earlier day read-only', () => {
    const { result } = setup();
    act(() => result.current.setDay(addDays(today, -3)));
    expect(result.current).toMatchObject({ day: addDays(today, -3), isToday: false, editable: false });
  });

  it('ignores a day after today', () => {
    const { result } = setup();
    act(() => result.current.setDay(addDays(today, 2)));
    expect(result.current.day).toBe(today);
  });

  it('goes back to today on request', () => {
    const { result } = setup();
    act(() => result.current.setDay(addDays(today, -2)));
    act(() => result.current.showToday());
    expect(result.current.day).toBe(today);
  });

  it('goes back to today when the app is put away', () => {
    const { result, appState } = setup();
    act(() => result.current.setDay(addDays(today, -2)));
    appState('inactive');
    expect(result.current.day).toBe(addDays(today, -2)); // a notification shade isn't leaving
    appState('background');
    expect(result.current.day).toBe(today);
  });
});

describe('useViewedDay without a provider', () => {
  it('is always today', () => {
    const { result } = renderHook(() => useViewedDay());
    expect(result.current).toMatchObject({ day: today, isToday: true, editable: true });
    act(() => result.current.setDay(addDays(today, -1)));
    expect(result.current.day).toBe(today);
  });
});
