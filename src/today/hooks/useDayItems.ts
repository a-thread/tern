import { useFood } from '../../domain/food/FoodContext';
import { useWeight } from '../../domain/weight/WeightContext';
import { useSettings } from '../../domain/settings/SettingsContext';
import { useMedication } from '../../domain/medication/MedicationContext';
import { useWater } from '../../domain/water/WaterContext';
import { useMood } from '../../domain/mood/MoodContext';
import { leftToDo } from '../models/leftToDo';
import { todaySummary } from '../models/todaySummary';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useMovement } from '../../domain/movement/MovementContext';
import { entriesOn } from '../../domain/movement/models/movementEntry';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { dayKey, parseDayKey } from '@shared/utils/date';

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/** Late on `day`: the moment a past day is judged from (every meal's time has come). */
const lateOn = (day: string) => {
  const d = parseDayKey(day);
  d.setHours(21);
  return d;
};

/** Days before yesterday have no open items. */
export function useDayItems() {
  const { day, isToday, editable } = useViewedDay();
  // Food, water, medication and the check-in already follow the viewed day.
  const { weightEntries, isWeighInSkipped } = useWeight();
  const { settings } = useSettings();
  // With food off, past logs are kept but nothing about meals shows.
  const food = useFood();
  const foodLog = settings.trackFood ? food.foodLog : [];
  const skippedMeals = settings.trackFood ? food.skippedMeals : [];
  const water = useWater();
  const mood = useMood();
  const meds = useMedication();
  const { todaySteps, days } = useActivity();
  const movement = useMovement();

  const record = days.find((d) => d.day === day);
  const steps = isToday ? todaySteps : (record?.steps ?? 0);
  const stepGoal = isToday
    ? settings.stepGoal
    : (record?.goal ?? settings.stepGoal);
  const stepsReached = steps / stepGoal >= 1;
  // A goal day reached by movement rather than steps.
  const movedToGoal = isToday
    ? movement.enabled &&
      !stepsReached &&
      movement.todayGoalMinutes >= settings.movementGoalMinutes
    : (record?.movedToGoal ?? false);
  const reached = stepsReached || movedToGoal;
  const movementOnDay = entriesOn(movement.entries, day);
  const takenMedications = meds.taken;

  // The latest weigh-in as of the day (entries are newest first).
  const lastWeight = isToday
    ? weightEntries[0]
    : weightEntries.find((e) => dayKey(new Date(e.loggedAt)) <= day);
  const now = isToday ? new Date() : lateOn(day);
  const checkIn = mood.enabled ? mood.onDay : undefined;
  // Only meaningful while weight is tracked and nothing was weighed in that day.
  const weighInSkipped = settings.trackWeight && isWeighInSkipped(day);

  const openItems = !editable
    ? []
    : leftToDo(foodLog, lastWeight, now, {
        weighIn: settings.trackWeight
          ? {
              frequency: settings.weighInFrequency,
              weekday: settings.reminders.weighIn.weekday,
            }
          : null,
        weighInSkipped,
        meals: settings.trackFood,
        skippedMeals,
        medications: meds.due,
        water: water.enabled
          ? { totalOz: water.totalOz, goalOz: water.goalOz }
          : null,
        checkIn: mood.enabled && !checkIn,
      });

  const summary = todaySummary(
    foodLog,
    // With weight off, a weigh-in logged earlier doesn't show in the day's lists.
    settings.trackWeight ? lastWeight : undefined,
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
    weighInSkipped ||
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
    weighInSkipped,
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
