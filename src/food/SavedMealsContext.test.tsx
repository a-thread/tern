import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { dayKey } from '@shared/utils/date';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { FoodProvider, useFood } from './FoodContext';
import { SavedMealsProvider, useSavedMeals } from './SavedMealsContext';
import { itemsToEntries } from './savedMeals';
import type { FoodEntry } from './models';

const entry = (name: string, over: Partial<FoodEntry> = {}): FoodEntry => ({
  id: `id-${name}`,
  name,
  meal: 'breakfast',
  servings: 1,
  servingLabel: '1 serving',
  calories: 100,
  protein: 5,
  carbs: 10,
  fat: 2,
  tier: 1,
  ...over,
});

async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <FoodProvider>
        <SavedMealsProvider>
          <WaypointsProvider>{children}</WaypointsProvider>
        </SavedMealsProvider>
      </FoodProvider>
    </BackendProvider>
  );
  const hook = renderHook(
    () => ({ saved: useSavedMeals(), food: useFood(), points: useWaypoints() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.saved.ready).toBe(true);
    expect(hook.result.current.food.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  return { ...hook, backend };
}

describe('saving meals', () => {
  it('saves entries as a named meal, sorted by name, and persists it', async () => {
    const { result, backend } = await setup();
    let outcome: ReturnType<typeof result.current.saved.saveMeal> | undefined;
    await act(async () => {
      outcome = result.current.saved.saveMeal('  Usual   breakfast ', [entry('Oats'), entry('Banana')]);
      result.current.saved.saveMeal('Big salad', [entry('Lettuce')]);
    });
    expect(outcome).toMatchObject({ ok: true, replaced: false });
    expect(result.current.saved.meals.map((m) => m.name)).toEqual(['Big salad', 'Usual breakfast']);
    const stored = await backend.savedMeals.list();
    expect(stored.find((m) => m.name === 'Usual breakfast')?.items.map((i) => i.name)).toEqual(['Oats', 'Banana']);
  });

  it('replaces a meal with the same name (ignoring case), keeping its id', async () => {
    const { result, backend } = await setup();
    await act(async () => {
      result.current.saved.saveMeal('Lunch', [entry('Soup')]);
    });
    const id = result.current.saved.meals[0].id;

    let outcome: ReturnType<typeof result.current.saved.saveMeal> | undefined;
    await act(async () => {
      outcome = result.current.saved.saveMeal('lunch', [entry('Sandwich'), entry('Apple')]);
    });
    expect(outcome).toMatchObject({ ok: true, replaced: true });
    expect(result.current.saved.meals).toHaveLength(1);
    expect(result.current.saved.meals[0].id).toBe(id);
    expect(result.current.saved.meals[0].items.map((i) => i.name)).toEqual(['Sandwich', 'Apple']);
    expect((await backend.savedMeals.list())[0].items).toHaveLength(2);
  });

  it('refuses a blank name or an empty meal', async () => {
    const { result } = await setup();
    let a, b;
    await act(async () => {
      a = result.current.saved.saveMeal('   ', [entry('Oats')]);
      b = result.current.saved.saveMeal('Empty', []);
    });
    expect(a).toMatchObject({ ok: false });
    expect(b).toMatchObject({ ok: false });
    expect(result.current.saved.meals).toEqual([]);
  });
});

describe('renaming and deleting', () => {
  it('renames, but not onto another meal’s name', async () => {
    const { result, backend } = await setup();
    await act(async () => {
      result.current.saved.saveMeal('Breakfast A', [entry('Oats')]);
      result.current.saved.saveMeal('Breakfast B', [entry('Eggs')]);
    });
    const a = result.current.saved.meals.find((m) => m.name === 'Breakfast A')!;

    let error: string | null = 'unset';
    await act(async () => {
      error = result.current.saved.renameMeal(a.id, 'breakfast b');
    });
    expect(error).toMatch(/already have/);

    await act(async () => {
      error = result.current.saved.renameMeal(a.id, 'Porridge');
    });
    expect(error).toBeNull();
    expect(result.current.saved.meals.map((m) => m.name)).toEqual(['Breakfast B', 'Porridge']);
    expect((await backend.savedMeals.list()).map((m) => m.name).sort()).toEqual(['Breakfast B', 'Porridge']);
  });

  it('allows changing only the case of its own name', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.saved.saveMeal('lunch', [entry('Soup')]);
    });
    let error: string | null = 'unset';
    await act(async () => {
      error = result.current.saved.renameMeal(result.current.saved.meals[0].id, 'Lunch');
    });
    expect(error).toBeNull();
    expect(result.current.saved.meals[0].name).toBe('Lunch');
  });

  it('deletes a meal from the list and the store', async () => {
    const { result, backend } = await setup();
    await act(async () => {
      result.current.saved.saveMeal('Lunch', [entry('Soup')]);
    });
    await act(async () => result.current.saved.deleteMeal(result.current.saved.meals[0].id));
    expect(result.current.saved.meals).toEqual([]);
    expect(await backend.savedMeals.list()).toEqual([]);
  });
});

describe('adding a saved meal to the log', () => {
  it('adds every item, with its portion, to the chosen meal, and persists them', async () => {
    const { result, backend } = await setup();
    // Start from a clean log so counts are exact.
    await act(async () => {
      result.current.food.foodLog.forEach((f) => result.current.food.removeFoodEntry(f.id));
    });
    await act(async () => {
      result.current.saved.saveMeal('Usual', [
        entry('Oats', { servingLabel: '40 g', calories: 150 }),
        entry('Banana', { servingLabel: '1 medium (118 g)', calories: 105 }),
      ]);
    });
    const meal = result.current.saved.meals[0];

    await act(async () => {
      result.current.food.addFoodEntries(itemsToEntries(meal.items, 'lunch'));
    });
    const lunch = result.current.food.foodLog.filter((f) => f.meal === 'lunch');
    expect(lunch.map((f) => [f.name, f.servingLabel, f.calories])).toEqual([
      ['Oats', '40 g', 150],
      ['Banana', '1 medium (118 g)', 105],
    ]);
    expect(new Set(lunch.map((f) => f.id)).size).toBe(2); // fresh ids
    expect((await backend.food.load(dayKey())).filter((f) => f.meal === 'lunch')).toHaveLength(2);
  });

  it('earns the meals bonus once when a saved meal completes the day', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.food.foodLog.forEach((f) => result.current.food.removeFoodEntry(f.id));
    });
    const before = result.current.points.waypoints;

    // One saved meal holding a food, added to each core meal in turn.
    await act(async () => {
      result.current.saved.saveMeal('Basics', [entry('Toast')]);
    });
    const meal = result.current.saved.meals[0];
    await act(async () => {
      (['breakfast', 'lunch', 'dinner'] as const).forEach((m) =>
        result.current.food.addFoodEntries(itemsToEntries(meal.items, m)),
      );
    });
    expect(result.current.points.waypoints).toBe(before + 15);
    expect(result.current.points.celebrations.filter((c) => c.source === 'meals')).toHaveLength(1);
  });
});

describe('quick successive saves', () => {
  it('treats two saves of the same name in one moment as one meal', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.saved.saveMeal('Lunch', [entry('Soup')]);
      result.current.saved.saveMeal('lunch', [entry('Sandwich')]);
    });
    expect(result.current.saved.meals).toHaveLength(1);
    expect(result.current.saved.meals[0].items.map((i) => i.name)).toEqual(['Sandwich']);
  });
});
