import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProviders } from './AppProviders';
import { BackendProvider, createMemoryBackend } from './BackendContext';
import { useDoneToday } from './useDoneToday';
import { useFood } from './domain/food/FoodContext';
import { createMemoryFoodRepository } from './domain/food/food.repository';
import { Meal } from './domain/food/models/foodEntry';
import { useWeight } from './domain/weight/WeightContext';
import { createMemoryWeightRepository } from './domain/weight/weight.repository';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';

jest.mock('./RemindersSync', () => ({ RemindersSync: () => null }));

const today = dayKey();

const entry = (meal: Meal) => ({
  name: 'Food',
  meal,
  servings: 1,
  servingLabel: '1',
  calories: 100,
  protein: 0,
  carbs: 0,
  fat: 0,
  tier: 1 as const,
});

async function setup() {
  const backend = {
    ...createMemoryBackend(),
    food: createMemoryFoodRepository([]),
    weight: createMemoryWeightRepository([]),
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <BackendProvider backend={backend}>
        <AppProviders>{children}</AppProviders>
      </BackendProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({ today: useDoneToday(), food: useFood(), weight: useWeight() }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.today.ready).toBe(true));
  return hook;
}

describe('useDoneToday', () => {
  it('starts with nothing done', async () => {
    const { result } = await setup();
    expect(result.current.today.done).toMatchObject({
      rest: false,
      meals: false,
      weighIn: false,
      water: false,
      mood: false,
      medications: [],
    });
  });

  it('counts a weigh-in, or a skipped one, as the weigh-in being done', async () => {
    const { result } = await setup();
    await act(async () => result.current.weight.setWeighInSkipped(today, true));
    expect(result.current.today.done.weighIn).toBe(true);

    await act(async () =>
      result.current.weight.setWeighInSkipped(today, false),
    );
    expect(result.current.today.done.weighIn).toBe(false);

    await act(async () => result.current.weight.addWeightEntry(163.4));
    expect(result.current.today.done.weighIn).toBe(true);
  });

  it('counts meals as done once every core meal is logged or marked skipped', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.food.addFoodEntry(entry(Meal.Breakfast));
      result.current.food.addFoodEntry(entry(Meal.Lunch));
    });
    expect(result.current.today.done.meals).toBe(false);

    await act(async () =>
      result.current.food.setMealSkipped(Meal.Dinner, true),
    );
    expect(result.current.today.done.meals).toBe(true);
  });
});
