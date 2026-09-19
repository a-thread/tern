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

describe('celebration queue', () => {
  const newEntry = (meal: 'dinner' | 'breakfast') => ({
    name: 'Test',
    meal,
    servings: 1,
    servingLabel: '1',
    calories: 1,
    protein: 1,
    carbs: 1,
    fat: 1,
    tier: 1 as const,
  });

  it('queues a celebration for a step-goal award and holds its points as pending', () => {
    const { result } = renderHook(() => useHarness(), { wrapper });
    const initial = result.current.waypoints;

    act(() => result.current.addWaypoints(40, 'steps'));

    expect(result.current.waypoints).toBe(initial + 40);
    expect(result.current.celebrations).toHaveLength(1);
    expect(result.current.celebrations[0]).toMatchObject({ points: 40, source: 'steps' });
    expect(result.current.pendingPoints).toBe(40);
  });

  it('clears the pending points once the celebration completes', () => {
    const { result } = renderHook(() => useHarness(), { wrapper });
    act(() => result.current.addWaypoints(40, 'steps'));

    act(() => result.current.completeCelebration(result.current.celebrations[0].id));

    expect(result.current.celebrations).toHaveLength(0);
    expect(result.current.pendingPoints).toBe(0);
  });

  it('celebrates the meals bonus when it is earned, and cancels it if it is taken back before playing', () => {
    const { result } = renderHook(() => useHarness(), { wrapper });
    const dinners = result.current.foodLog.filter((f) => f.meal === 'dinner');

    act(() => dinners.forEach((d) => result.current.removeFoodEntry(d.id)));
    expect(result.current.celebrations).toHaveLength(0); // a take-back is quiet

    act(() => result.current.addFoodEntry(newEntry('dinner')));
    expect(result.current.celebrations).toHaveLength(1);
    expect(result.current.celebrations[0].source).toBe('meals');

    const added = result.current.foodLog.find((f) => f.name === 'Test')!;
    act(() => result.current.removeFoodEntry(added.id));
    expect(result.current.celebrations).toHaveLength(0);
  });
});
