import { useEffect, useState } from 'react';

import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { useSettings } from '@settings/SettingsContext';
import { useMedication } from '@medication/MedicationContext';
import type { Medication } from '@medication/models/medication';
import { useWater } from '@water/WaterContext';
import { useMood } from '@mood/MoodContext';
import { leftToDo } from '@today/models/leftToDo';
import { todaySummary } from '@today/models/todaySummary';
import { useActivity } from '@today/ActivityContext';
import { useMovement } from '@movement/MovementContext';
import { entriesOn } from '@movement/models/movementEntry';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { dayKey, parseDayKey } from '@shared/utils/date';

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Late on `day`: the moment a past day is judged from (every meal's time has come). */
const lateOn = (day: string) => {
  const d = parseDayKey(day);
  d.setHours(21);
  return d;
};

/**
 * What is still open and what has been done on the viewed day (today unless a past day
 * is picked), drawn from every tracked domain. Yesterday can still be filled in, so it
 * has open items too (never medication, which is today only); earlier days have none.
 */
export function useDayItems() {
  const { day, isToday, editable } = useViewedDay();
  // Food, water and the check-in already follow the viewed day.
  const { foodLog, skippedMeals } = useFood();
  const { weightEntries } = useWeight();
  const { settings } = useSettings();
  const water = useWater();
  const mood = useMood();
  const meds = useMedication();
  const { todaySteps, week } = useActivity();
  const movement = useMovement();

  // Medication taken on a past day is read once, for looking back.
  const [pastTaken, setPastTaken] = useState<Medication[]>([]);
  const { loadTaken } = meds;
  useEffect(() => {
    if (isToday) return;
    let cancelled = false;
    setPastTaken([]);
    loadTaken(day)
      .then((taken) => !cancelled && setPastTaken(taken))
      .catch((e) => console.warn('Could not load medication for the day', e));
    return () => {
      cancelled = true;
    };
  }, [isToday, day, loadTaken]);

  const record = week.find((d) => d.day === day);
  const steps = isToday ? todaySteps : (record?.steps ?? 0);
  const stepGoal = isToday ? settings.stepGoal : (record?.goal ?? settings.stepGoal);
  const stepsReached = steps / stepGoal >= 1;
  // A goal day reached by movement rather than steps.
  const movedToGoal = isToday
    ? movement.enabled && !stepsReached && movement.todayGoalMinutes >= settings.movementGoalMinutes
    : (record?.movedToGoal ?? false);
  const reached = stepsReached || movedToGoal;
  const movementOnDay = entriesOn(movement.entries, day);
  const takenMedications = isToday ? meds.taken : pastTaken;

  // The latest weigh-in as of the day (entries are newest first).
  const lastWeight = isToday
    ? weightEntries[0]
    : weightEntries.find((e) => dayKey(new Date(e.loggedAt)) <= day);
  const now = isToday ? new Date() : lateOn(day);
  const checkIn = mood.enabled ? mood.onDay : undefined;

  const openItems = !editable
    ? []
    : leftToDo(foodLog, lastWeight, now, {
        weighIn: settings.trackWeight
          ? { frequency: settings.weighInFrequency, weekday: settings.reminders.weighIn.weekday }
          : null,
        skippedMeals,
        medications: isToday ? meds.due : [],
        water: water.enabled ? { totalOz: water.totalOz, goalOz: water.goalOz } : null,
        checkIn: mood.enabled && !checkIn,
      });

  const summary = todaySummary(
    foodLog,
    lastWeight,
    takenMedications.map((m) => m.name),
    reached,
    now,
    water.enabled ? water.totalOz : 0,
    checkIn ? { mood: checkIn.mood, stress: checkIn.stress } : null,
  );

  // Meals done: those with food, then those marked "nothing today".
  const mealsDone = [
    ...(summary.meals?.names ?? []).map(capitalize),
    ...skippedMeals.map((m) => `no ${m}`),
  ];
  // Today's water shows once the goal is met; a past day shows whatever was drunk.
  const waterDone = summary.waterOz !== null && (water.reached || !isToday);

  // The done list sits alongside "Left to do" as soon as anything is done, so
  // there's always somewhere to see (and undo) it — nothing waits on finishing everything.
  const anythingDone =
    mealsDone.length > 0 ||
    summary.weighedIn !== null ||
    summary.checkIn !== null ||
    takenMedications.length > 0 ||
    waterDone ||
    movementOnDay.length > 0 ||
    summary.stepGoalReached;

  return {
    day,
    isToday,
    editable,
    steps,
    openItems,
    summary,
    mealsDone,
    waterDone,
    anythingDone,
    takenMedications,
    lastWeight,
    reached,
    movementOnDay,
    movedToGoal,
  };
}
