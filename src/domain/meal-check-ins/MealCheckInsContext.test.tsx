import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { createMemoryBackend, type Backend } from '../../BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { Meal } from '../food/models/foodEntry';
import { MealCheckInsProvider, useMealCheckIns } from './MealCheckInsContext';

const today = dayKey();

async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <SettingsProvider repo={backend.settings}>
        <MealCheckInsProvider repo={backend.mealCheckIns}>
          {children}
        </MealCheckInsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({ checkIns: useMealCheckIns(), settings: useSettings() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.checkIns.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
  });
  return { ...hook, backend };
}

describe('MealCheckInsProvider', () => {
  it('is off by default, until turned on in Settings', async () => {
    const { result } = await setup();
    expect(result.current.checkIns.enabled).toBe(false);
    await act(async () =>
      result.current.settings.updateSettings({ checkInAfterMeals: true }),
    );
    expect(result.current.checkIns.enabled).toBe(true);
  });

  it('keeps one check-in per meal, and checking in again replaces it', async () => {
    const { result, backend } = await setup();
    await act(async () => {
      result.current.checkIns.checkIn(Meal.Lunch, 3, 4);
      result.current.checkIns.checkIn(Meal.Dinner, 5, 2);
    });
    await act(async () => {
      result.current.checkIns.checkIn(Meal.Lunch, 2, 5);
    });
    expect(result.current.checkIns.forMeal(Meal.Lunch)).toEqual({
      day: today,
      meal: Meal.Lunch,
      fullness: 2,
      feeling: 5,
    });
    expect(result.current.checkIns.forMeal(Meal.Dinner)?.fullness).toBe(5);
    expect(result.current.checkIns.forMeal(Meal.Breakfast)).toBeUndefined();
    expect(await backend.mealCheckIns.load(today, today)).toHaveLength(2);
  });

  it('refuses a score off the scale', async () => {
    const { result } = await setup();
    let ok = true;
    await act(async () => {
      ok = result.current.checkIns.checkIn(Meal.Lunch, 6, 3);
    });
    expect(ok).toBe(false);
    expect(result.current.checkIns.entries).toHaveLength(0);
  });

  it('removes one meal’s check-in and leaves the others', async () => {
    const { result, backend } = await setup();
    await act(async () => {
      result.current.checkIns.checkIn(Meal.Lunch, 3, 3);
      result.current.checkIns.checkIn(Meal.Snack, 2, 4);
    });
    await act(async () => result.current.checkIns.clear(Meal.Lunch));
    expect(result.current.checkIns.forMeal(Meal.Lunch)).toBeUndefined();
    expect(result.current.checkIns.forMeal(Meal.Snack)).toBeDefined();
    expect(await backend.mealCheckIns.load(today, today)).toHaveLength(1);
  });

  it('keeps a note with the check-in, and checking in again without one clears it', async () => {
    const { result, backend } = await setup();
    await act(async () => {
      result.current.checkIns.checkIn(Meal.Lunch, 3, 4, '  ate with friends ');
    });
    expect(result.current.checkIns.forMeal(Meal.Lunch)?.note).toBe(
      'ate with friends',
    );
    expect((await backend.mealCheckIns.load(today, today))[0].note).toBe(
      'ate with friends',
    );

    await act(async () => {
      result.current.checkIns.checkIn(Meal.Lunch, 3, 4, '   ');
    });
    expect(result.current.checkIns.forMeal(Meal.Lunch)).not.toHaveProperty(
      'note',
    );
  });
});
