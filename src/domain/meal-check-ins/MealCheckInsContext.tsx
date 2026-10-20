import React, { useCallback, useMemo } from 'react';

import type { MealCheckInsRepository } from './mealCheckIns.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useSyncedList } from '@shared/hooks/useSyncedList';
import { addDays } from '@shared/utils/date';
import { useSettings } from '../settings/SettingsContext';
import type { Meal } from '../food/models/foodEntry';
import {
  checkInFor,
  cleanNote,
  isValidMealScore,
  type MealCheckIn,
} from './models/mealCheckIn';

/** How far back the context keeps meal check-ins. */
export const HISTORY_DAYS = 180;

type MealCheckInsContextValue = {
  /** False until check-ins have loaded once. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  /** "Check in after meals" is switched on in Settings. */
  enabled: boolean;
  /** The last 180 days of meal check-ins, oldest first. */
  entries: MealCheckIn[];
  /** The viewed day's check-in for a meal, if there is one. */
  forMeal: (meal: Meal) => MealCheckIn | undefined;
  /**
   * Saves the viewed day's check-in for a meal, with an optional note, replacing an earlier
   * one. False if a score is off the scale or the day can't be edited (before yesterday).
   */
  checkIn: (
    meal: Meal,
    fullness: number,
    feeling: number,
    note?: string,
  ) => boolean;
  /** Removes the viewed day's check-in for a meal. */
  clear: (meal: Meal) => void;
};

const [MealCheckInsContext, useMealCheckIns] =
  createRequiredContext<MealCheckInsContextValue>(
    'useMealCheckIns',
    'MealCheckInsProvider',
  );
export { useMealCheckIns };

/** How each meal sat, checked in after eating. Optional, and off by default. Must sit inside SettingsProvider. */
export function MealCheckInsProvider({
  repo,
  children,
}: {
  repo: MealCheckInsRepository;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const today = useDayKey();
  const { day, editable } = useViewedDay();

  const { entries, ready, reload, change } = useSyncedList(
    useCallback(
      () => repo.load(addDays(today, -(HISTORY_DAYS - 1)), today),
      [repo, today],
    ),
    'Could not load meal check-ins',
  );

  const forMeal = useCallback(
    (meal: Meal) => checkInFor(entries, day, meal),
    [entries, day],
  );

  const checkIn = useCallback(
    (meal: Meal, fullness: number, feeling: number, note?: string) => {
      if (
        !editable ||
        !isValidMealScore(fullness) ||
        !isValidMealScore(feeling)
      )
        return false;
      const cleaned = cleanNote(note);
      const entry: MealCheckIn = {
        day,
        meal,
        fullness,
        feeling,
        ...(cleaned ? { note: cleaned } : {}),
      };
      change(
        (prev) => [
          ...prev.filter((e) => !(e.day === day && e.meal === meal)),
          entry,
        ],
        repo.save(entry),
        {
          log: 'Could not save meal check-in',
          toast: "Couldn't save your check-in — please try again.",
        },
      );
      return true;
    },
    [repo, day, editable, change],
  );

  const clear = useCallback(
    (meal: Meal) => {
      if (!editable) return;
      change(
        (prev) => prev.filter((e) => !(e.day === day && e.meal === meal)),
        repo.remove(day, meal),
        {
          log: 'Could not remove meal check-in',
          toast: "Couldn't undo that — please try again.",
        },
      );
    },
    [repo, day, editable, change],
  );

  const value = useMemo<MealCheckInsContextValue>(
    () => ({
      ready,
      reload,
      enabled: settings.checkInAfterMeals,
      entries,
      forMeal,
      checkIn,
      clear,
    }),
    [
      ready,
      reload,
      settings.checkInAfterMeals,
      entries,
      forMeal,
      checkIn,
      clear,
    ],
  );

  return (
    <MealCheckInsContext.Provider value={value}>
      {children}
    </MealCheckInsContext.Provider>
  );
}
