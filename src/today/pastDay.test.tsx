import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { createMemoryBackend } from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { ViewedDayProvider, useViewedDay } from '@shared/state/ViewedDayContext';
import { addDays, dayKey } from '@shared/utils/date';
import { FoodProvider, useFood } from '@food/FoodContext';
import { createMemoryFoodRepository } from '@food/data/food.repository';
import { Meal } from '@food/models/foodEntry';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { WaypointSource } from '@journey/models/waypoint';
import { WaterProvider, useWater } from '@water/WaterContext';
import { MoodProvider, useMood } from '@mood/MoodContext';

// Looking back at a past day: food, water and the check-in follow the viewed day, yesterday
// can be filled in, earlier days can't, and no waypoint moves while a past day is showing.

const today = dayKey();
const yesterday = addDays(today, -1);

const snack = {
  name: 'Apple',
  meal: Meal.Snack,
  servings: 1,
  servingLabel: '1 medium',
  calories: 95,
  protein: 0,
  carbs: 25,
  fat: 0,
  tier: 1 as const,
};

async function setup() {
  const backend = { ...createMemoryBackend(), food: createMemoryFoodRepository([]) };
  const add = jest.spyOn(backend.food, 'add');
  const setSkipped = jest.spyOn(backend.food, 'setSkipped');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <SettingsProvider repo={backend.settings}>
        <WaypointsProvider repo={backend.waypoints}>
          <ViewedDayProvider>
            <FoodProvider repo={backend.food}>
              <WaterProvider repo={backend.water}>
                <MoodProvider repo={backend.mood}>{children}</MoodProvider>
              </WaterProvider>
            </FoodProvider>
          </ViewedDayProvider>
        </WaypointsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({
      viewed: useViewedDay(),
      food: useFood(),
      water: useWater(),
      mood: useMood(),
      settings: useSettings(),
      points: useWaypoints(),
    }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.food.ready).toBe(true);
    expect(hook.result.current.water.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  await act(async () => {
    hook.result.current.settings.updateSettings({ trackWater: true, waterGoalOz: 8, trackMood: true });
  });
  return { ...hook, backend, add, setSkipped };
}

type Result = Awaited<ReturnType<typeof setup>>['result'];

const view = async (result: Result, day: string) => {
  await act(async () => result.current.viewed.setDay(day));
  await waitFor(() => expect(result.current.food.loadedDay).toBe(day));
};

const awarded = (result: Result) => result.current.points.events.filter((e) => e.day === today);

describe('a past day', () => {
  it('logs food to yesterday and pays nothing for it', async () => {
    const { result, add, setSkipped } = await setup();
    await view(result, yesterday);

    await act(async () => {
      result.current.food.addFoodEntry(snack);
      result.current.food.setMealSkipped(Meal.Breakfast, true);
    });
    expect(add).toHaveBeenCalledWith(yesterday, expect.objectContaining({ name: 'Apple' }));
    expect(setSkipped).toHaveBeenCalledWith(yesterday, Meal.Breakfast, true);
    expect(result.current.food.foodLog.map((f) => f.name)).toEqual(['Apple']);
    const food = [WaypointSource.Meals, WaypointSource.Breakfast, WaypointSource.Lunch, WaypointSource.Dinner];
    expect(awarded(result).filter((e) => food.includes(e.source))).toEqual([]);
  });

  it('refuses food changes before yesterday', async () => {
    const { result, add, setSkipped } = await setup();
    await view(result, addDays(today, -3));

    await act(async () => {
      result.current.food.addFoodEntry(snack);
      result.current.food.addFoodEntries([snack]);
      result.current.food.setMealSkipped(Meal.Lunch, true);
    });
    expect(add).not.toHaveBeenCalled();
    expect(setSkipped).not.toHaveBeenCalled();
    expect(result.current.food.foodLog).toEqual([]);
  });

  it("adds water to yesterday without earning today's water goal", async () => {
    const { result, backend } = await setup();
    await view(result, yesterday);

    let ok = false;
    await act(async () => {
      ok = result.current.water.addWater(12);
    });
    expect(ok).toBe(true);
    expect(result.current.water.totalOz).toBe(12);
    expect(result.current.water.reached).toBe(true);
    const saved = await backend.water.load(yesterday, yesterday);
    expect(saved).toEqual([expect.objectContaining({ oz: 12, loggedOn: yesterday })]);
    expect(dayKey(new Date(saved[0].loggedAt))).toBe(yesterday);
    expect(awarded(result).some((e) => e.source === WaypointSource.Water)).toBe(false);
  });

  it("keeps today's water award while looking back and on return", async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.water.addWater(12);
    });
    const hasWater = () => awarded(result).some((e) => e.source === WaypointSource.Water);
    await waitFor(() => expect(hasWater()).toBe(true));

    await view(result, yesterday);
    expect(result.current.water.totalOz).toBe(0);
    expect(hasWater()).toBe(true);

    await view(result, today);
    await waitFor(() => expect(result.current.water.totalOz).toBe(12));
    expect(hasWater()).toBe(true);
  });

  it('refuses water before yesterday', async () => {
    const { result } = await setup();
    await view(result, addDays(today, -2));
    let ok = true;
    await act(async () => {
      ok = result.current.water.addWater(12);
    });
    expect(ok).toBe(false);
    expect(result.current.water.totalOz).toBe(0);
  });

  it("checks in for yesterday, leaving today's check-in open", async () => {
    const { result, backend } = await setup();
    await view(result, yesterday);

    await act(async () => {
      result.current.mood.checkIn(7, 3);
    });
    expect(result.current.mood.onDay).toEqual({ day: yesterday, mood: 7, stress: 3 });
    expect(result.current.mood.today).toBeUndefined();
    expect(await backend.mood.load(yesterday, yesterday)).toEqual([{ day: yesterday, mood: 7, stress: 3 }]);
    expect(awarded(result).some((e) => e.source === WaypointSource.Mood)).toBe(false);
  });
});
