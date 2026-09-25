import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { FoodProvider, useFood } from '@food/FoodContext';
import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { dayKey } from '@shared/utils/date';
import { WaypointsProvider, useWaypoints } from './WaypointsContext';
import { INITIAL_WAYPOINTS } from './mock';

function useHarness() {
  const food = useFood();
  const points = useWaypoints();
  return { ...food, ...points, ready: food.ready && points.ready };
}

/** Renders the food + waypoints providers over a fresh in-memory backend, once both have loaded. */
async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <FoodProvider>
        <WaypointsProvider>{children}</WaypointsProvider>
      </FoodProvider>
    </BackendProvider>
  );
  const hook = renderHook(() => useHarness(), { wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return { ...hook, backend };
}

/**
 * Regression test for the bug where removing a food entry didn't affect
 * waypoints — the "logging all meals" bonus must be revoked the moment
 * coverage drops, not just awarded once and left stuck.
 */
describe('waypoints meals bonus (reactive to foodLog)', () => {
  it('earns the bonus for a meal marked "nothing today", and un-marks it once food is added', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;
    const lunch = result.current.foodLog.filter((f) => f.meal === 'lunch');
    await act(async () => lunch.forEach((f) => result.current.removeFoodEntry(f.id)));
    expect(result.current.waypoints).toBe(initial - 15);

    await act(async () => result.current.setMealSkipped('lunch', true));
    await waitFor(() => expect(result.current.waypoints).toBe(initial));

    await act(async () => result.current.addFoodEntry(lunch[0])); // a fresh id is given on add
    await waitFor(() => expect(result.current.skippedMeals).toEqual([]));
    expect(result.current.waypoints).toBe(initial); // still covered, by food now
  });

  it('starts with the seed log already covering all meals, so no double-award on mount', async () => {
    const { result } = await setup();
    expect(result.current.waypoints).toBe(INITIAL_WAYPOINTS);
  });

  it('revokes the bonus when a removal drops meal coverage, and re-awards it when coverage is restored', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;

    const dinnerEntries = result.current.foodLog.filter(
      (f) => f.meal === 'dinner',
    );
    expect(dinnerEntries.length).toBeGreaterThan(0);

    await act(async () => {
      dinnerEntries.forEach((entry) =>
        result.current.removeFoodEntry(entry.id),
      );
    });
    expect(result.current.waypoints).toBe(initial - 15);

    await act(async () => {
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

  it('queues a celebration for a step-goal award and holds its points as pending', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;

    await act(async () => result.current.addWaypoints(40, 'steps'));

    expect(result.current.waypoints).toBe(initial + 40);
    expect(result.current.celebrations).toHaveLength(1);
    expect(result.current.celebrations[0]).toMatchObject({ points: 40, source: 'steps' });
    expect(result.current.pendingPoints).toBe(40);
  });

  it('clears the pending points once the celebration completes', async () => {
    const { result } = await setup();
    await act(async () => result.current.addWaypoints(40, 'steps'));

    await act(async () => result.current.completeCelebration(result.current.celebrations[0].id));

    expect(result.current.celebrations).toHaveLength(0);
    expect(result.current.pendingPoints).toBe(0);
  });

  it('celebrates the meals bonus when it is earned, and cancels it if it is taken back before playing', async () => {
    const { result } = await setup();
    const dinners = result.current.foodLog.filter((f) => f.meal === 'dinner');

    await act(async () => dinners.forEach((d) => result.current.removeFoodEntry(d.id)));
    expect(result.current.celebrations).toHaveLength(0); // a take-back is quiet

    await act(async () => result.current.addFoodEntry(newEntry('dinner')));
    expect(result.current.celebrations).toHaveLength(1);
    expect(result.current.celebrations[0].source).toBe('meals');

    const added = result.current.foodLog.find((f) => f.name === 'Test')!;
    await act(async () => result.current.removeFoodEntry(added.id));
    expect(result.current.celebrations).toHaveLength(0);
  });
});

describe('waypoints ledger', () => {
  it('awards a source only once per day', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;

    await act(async () => result.current.addWaypoints(40, 'steps'));
    await act(async () => result.current.addWaypoints(40, 'steps'));

    expect(result.current.waypoints).toBe(initial + 40);
    expect(result.current.celebrations).toHaveLength(1);
  });

  it('persists awards and take-backs to the repository', async () => {
    const { result, backend } = await setup();
    const day = dayKey();

    await act(async () => result.current.addWaypoints(40, 'steps'));
    expect((await backend.waypoints.load(day)).total).toBe(INITIAL_WAYPOINTS + 40);

    const dinners = result.current.foodLog.filter((f) => f.meal === 'dinner');
    await act(async () => dinners.forEach((d) => result.current.removeFoodEntry(d.id)));
    const after = await backend.waypoints.load(day);
    expect(after.total).toBe(INITIAL_WAYPOINTS + 40 - 15);
    expect(after.todaySources).toEqual(['steps']);
  });
});
