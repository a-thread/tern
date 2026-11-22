import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { FoodProvider, useFood } from '../food/FoodContext';
import { createMemoryBackend, type Backend } from '../../BackendContext';
import { addDays, dayKey } from '@shared/utils/date';
import {
  ViewedDayProvider,
  useViewedDay,
} from '@shared/state/ViewedDayContext';
import { createMemoryFoodRepository } from '../food/food.repository';
import { WaypointsProvider, useWaypoints } from './WaypointsContext';
import { INITIAL_WAYPOINTS } from './waypoints.mock';
import { Meal } from '../food/models/foodEntry';
import { WaypointSource } from './models/waypoint';

function useHarness() {
  const food = useFood();
  const points = useWaypoints();
  return { ...food, ...points, ready: food.ready && points.ready };
}

/** Renders the food + waypoints providers over a fresh in-memory backend, once both have loaded. */
async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WaypointsProvider repo={backend.waypoints}>
      <FoodProvider repo={backend.food}>{children}</FoodProvider>
    </WaypointsProvider>
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
    const lunch = result.current.foodLog.filter((f) => f.meal === Meal.Lunch);
    await act(async () =>
      lunch.forEach((f) => result.current.removeFoodEntry(f.id)),
    );
    expect(result.current.waypoints).toBe(initial - 15 - 5); // the bonus, and lunch's own award

    // "Nothing today" completes the day again, but lunch's own award is for food logged.
    await act(async () => result.current.setMealSkipped(Meal.Lunch, true));
    await waitFor(() => expect(result.current.waypoints).toBe(initial - 5));

    await act(async () => result.current.addFoodEntry(lunch[0])); // a fresh id is given on add
    await waitFor(() => expect(result.current.skippedMeals).toEqual([]));
    expect(result.current.waypoints).toBe(initial); // covered by food now, and lunch pays again
  });

  it('starts with the seed log already covering all meals, so no double-award on mount', async () => {
    const { result } = await setup();
    expect(result.current.waypoints).toBe(INITIAL_WAYPOINTS);
  });

  it('revokes the bonus when a removal drops meal coverage, and re-awards it when coverage is restored', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;

    const dinnerEntries = result.current.foodLog.filter(
      (f) => f.meal === Meal.Dinner,
    );
    expect(dinnerEntries.length).toBeGreaterThan(0);

    await act(async () => {
      dinnerEntries.forEach((entry) =>
        result.current.removeFoodEntry(entry.id),
      );
    });
    expect(result.current.waypoints).toBe(initial - 15 - 5);

    await act(async () => {
      result.current.addFoodEntry({
        name: 'Chili, homemade',
        meal: Meal.Dinner,
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
  const newEntry = (meal: Meal) => ({
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

    await act(async () =>
      result.current.addWaypoints(40, WaypointSource.Steps),
    );

    expect(result.current.waypoints).toBe(initial + 40);
    expect(result.current.celebrations).toHaveLength(1);
    expect(result.current.celebrations[0]).toMatchObject({
      points: 40,
      source: 'steps',
    });
    expect(result.current.pendingPoints).toBe(40);
  });

  it('clears the pending points once the celebration completes', async () => {
    const { result } = await setup();
    await act(async () =>
      result.current.addWaypoints(40, WaypointSource.Steps),
    );

    await act(async () =>
      result.current.completeCelebration(result.current.celebrations[0].id),
    );

    expect(result.current.celebrations).toHaveLength(0);
    expect(result.current.pendingPoints).toBe(0);
  });

  it('celebrates the meals bonus and the meal when earned, and cancels them if taken back before playing', async () => {
    const { result } = await setup();
    const dinners = result.current.foodLog.filter(
      (f) => f.meal === Meal.Dinner,
    );

    await act(async () =>
      dinners.forEach((d) => result.current.removeFoodEntry(d.id)),
    );
    expect(result.current.celebrations).toHaveLength(0); // a take-back is quiet

    await act(async () => result.current.addFoodEntry(newEntry(Meal.Dinner)));
    expect(result.current.celebrations.map((c) => c.source).sort()).toEqual([
      'dinner',
      'meals',
    ]);

    const added = result.current.foodLog.find((f) => f.name === 'Test')!;
    await act(async () => result.current.removeFoodEntry(added.id));
    expect(result.current.celebrations).toHaveLength(0);
  });
});

describe('waypoints ledger', () => {
  it('awards a source only once per day', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;

    await act(async () =>
      result.current.addWaypoints(40, WaypointSource.Steps),
    );
    await act(async () =>
      result.current.addWaypoints(40, WaypointSource.Steps),
    );

    expect(result.current.waypoints).toBe(initial + 40);
    expect(result.current.celebrations).toHaveLength(1);
  });

  it('persists awards and take-backs to the repository', async () => {
    const { result, backend } = await setup();
    const day = dayKey();

    await act(async () =>
      result.current.addWaypoints(40, WaypointSource.Steps),
    );
    expect((await backend.waypoints.load(day)).total).toBe(
      INITIAL_WAYPOINTS + 40,
    );

    const dinners = result.current.foodLog.filter(
      (f) => f.meal === Meal.Dinner,
    );
    await act(async () =>
      dinners.forEach((d) => result.current.removeFoodEntry(d.id)),
    );
    const after = await backend.waypoints.load(day);
    expect(after.total).toBe(INITIAL_WAYPOINTS + 40 - 15 - 5);
    expect([...after.todaySources].sort()).toEqual([
      'breakfast',
      'lunch',
      'steps',
      'weight',
    ]);
  });
});

describe('waypoints for yesterday', () => {
  const today = dayKey();
  const yesterday = addDays(today, -1);

  it('awards and celebrates yesterday once, apart from today', async () => {
    const { result, backend } = await setup();
    const initial = result.current.waypoints;

    await act(async () =>
      result.current.addWaypoints(10, WaypointSource.Water, yesterday),
    );
    await act(async () =>
      result.current.addWaypoints(10, WaypointSource.Water, yesterday),
    );
    await act(async () =>
      result.current.addWaypoints(10, WaypointSource.Water),
    );

    expect(result.current.waypoints).toBe(initial + 20);
    expect(result.current.celebrations.map((c) => [c.day, c.source])).toEqual([
      [yesterday, WaypointSource.Water],
      [today, WaypointSource.Water],
    ]);
    const water = (await backend.waypoints.history()).filter(
      (e) => e.source === WaypointSource.Water,
    );
    expect(water.map((e) => e.day).sort()).toEqual([yesterday, today]);
  });

  it('takes back only the day asked', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;
    await act(async () => {
      result.current.addWaypoints(10, WaypointSource.Water, yesterday);
      result.current.addWaypoints(10, WaypointSource.Water);
    });

    await act(async () =>
      result.current.revokeWaypoints(10, WaypointSource.Water, yesterday),
    );

    expect(result.current.waypoints).toBe(initial + 10);
    expect(result.current.celebrations.map((c) => c.day)).toEqual([today]);
  });

  it('ignores a day before yesterday', async () => {
    const { result } = await setup();
    const initial = result.current.waypoints;
    await act(async () =>
      result.current.addWaypoints(10, WaypointSource.Water, addDays(today, -2)),
    );
    expect(result.current.waypoints).toBe(initial);
  });

  it("remembers yesterday's awards from the ledger, so they aren't paid twice", async () => {
    const backend = createMemoryBackend();
    await backend.waypoints.load(today); // seeds the ledger
    await backend.waypoints.award(WaypointSource.Mood, 10, yesterday);
    const { result } = await setup(backend);
    const initial = result.current.waypoints;

    await act(async () =>
      result.current.addWaypoints(10, WaypointSource.Mood, yesterday),
    );
    expect(result.current.waypoints).toBe(initial);
  });

  it('pays for a meal logged to yesterday, and takes it back when removed, like today', async () => {
    const backend = createMemoryBackend();
    backend.food = createMemoryFoodRepository([]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WaypointsProvider repo={backend.waypoints}>
        <ViewedDayProvider>
          <FoodProvider repo={backend.food}>{children}</FoodProvider>
        </ViewedDayProvider>
      </WaypointsProvider>
    );
    const { result } = renderHook(
      () => ({ ...useHarness(), viewed: useViewedDay() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => result.current.viewed.setDay(yesterday));
    await waitFor(() => expect(result.current.loadedDay).toBe(yesterday));
    const initial = result.current.waypoints;

    await act(async () =>
      result.current.addFoodEntry({
        name: 'Oats',
        meal: Meal.Breakfast,
        servings: 1,
        servingLabel: '1 bowl',
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
        tier: 1,
      }),
    );

    await waitFor(() => expect(result.current.waypoints).toBe(initial + 5));
    expect(
      result.current.events.filter(
        (e) => e.day === yesterday && e.source === WaypointSource.Breakfast,
      ),
    ).toHaveLength(1);
    expect(result.current.celebrations).toMatchObject([
      { day: yesterday, source: WaypointSource.Breakfast, points: 5 },
    ]);

    const oats = result.current.foodLog.find((f) => f.name === 'Oats')!;
    await act(async () => result.current.removeFoodEntry(oats.id));
    await waitFor(() => expect(result.current.waypoints).toBe(initial));
    expect(result.current.celebrations).toEqual([]);
  });
});
