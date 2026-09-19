import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { FoodProvider, useFood } from '@food/FoodContext';
import { WaypointsProvider, useWaypoints } from './WaypointsContext';
import { INITIAL_WAYPOINTS } from './mock';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <FoodProvider>
      <WaypointsProvider>{children}</WaypointsProvider>
    </FoodProvider>
  );
}

function useHarness() {
  return { ...useFood(), ...useWaypoints() };
}

/**
 * Regression test for the bug where removing a food entry didn't affect
 * waypoints — the "logging all meals" bonus must be revoked the moment
 * coverage drops, not just awarded once and left stuck.
 */
describe('waypoints meals bonus (reactive to foodLog)', () => {
  it('starts with the seed log already covering all meals, so no double-award on mount', () => {
    const { result } = renderHook(() => useHarness(), { wrapper });
    expect(result.current.waypoints).toBe(INITIAL_WAYPOINTS);
  });

  it('revokes the bonus when a removal drops meal coverage, and re-awards it when coverage is restored', () => {
    const { result } = renderHook(() => useHarness(), { wrapper });
    const initial = result.current.waypoints;

    const dinnerEntries = result.current.foodLog.filter(
      (f) => f.meal === 'dinner',
    );
    expect(dinnerEntries.length).toBeGreaterThan(0);

    act(() => {
      dinnerEntries.forEach((entry) =>
        result.current.removeFoodEntry(entry.id),
      );
    });
    expect(result.current.waypoints).toBe(initial - 15);

    act(() => {
      result.current.addFoodEntry({
        name: 'Chili, homemade',
        meal: 'dinner',
        servings: 1,
        servingLabel: '1 bowl',
        calories: 310,
        protein: 28,
        carbs: 24,
        fat: 9,
        tier: 2,
      });
    });
    expect(result.current.waypoints).toBe(initial);
  });
});
