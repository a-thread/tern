import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { useSettings } from '@settings/SettingsContext';
import { useMedication } from '@medication/MedicationContext';
import { useWater } from '@water/WaterContext';
import { useMood } from '@mood/MoodContext';
import { leftToDo } from '@today/models/leftToDo';
import { todaySummary } from '@today/models/todaySummary';
import { useActivity } from '@today/ActivityContext';

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** What is still open today, and what has been done, drawn from every tracked domain. */
export function useTodayItems() {
  const { foodLog, skippedMeals } = useFood();
  const { weightEntries } = useWeight();
  const { settings } = useSettings();
  const water = useWater();
  const mood = useMood();
  const { due: dueMedications, taken: takenMedications } = useMedication();
  const { todaySteps } = useActivity();

  const lastWeight = weightEntries[0];
  const reached = todaySteps / settings.stepGoal >= 1;

  const openItems = leftToDo(foodLog, lastWeight, new Date(), {
    weighIn: settings.trackWeight
      ? { frequency: settings.weighInFrequency, weekday: settings.reminders.weighIn.weekday }
      : null,
    skippedMeals,
    medications: dueMedications,
    water: water.enabled ? { totalOz: water.totalOz, goalOz: water.goalOz } : null,
    checkIn: mood.enabled && !mood.today,
  });

  const summary = todaySummary(
    foodLog,
    lastWeight,
    takenMedications.map((m) => m.name),
    reached,
    undefined,
    water.enabled ? water.totalOz : 0,
    mood.enabled && mood.today ? { mood: mood.today.mood, stress: mood.today.stress } : null,
  );

  // Meals done: those with food, then those marked "nothing today".
  const mealsDone = [
    ...(summary.meals?.names ?? []).map(capitalize),
    ...skippedMeals.map((m) => `no ${m}`),
  ];
  const waterDone = summary.waterOz !== null && water.reached;

  // "Today so far" sits alongside "Left to do" as soon as anything is done, so
  // there's always somewhere to see (and undo) it — nothing waits on finishing everything.
  const anythingDone =
    mealsDone.length > 0 ||
    summary.weighedIn !== null ||
    summary.checkIn !== null ||
    takenMedications.length > 0 ||
    waterDone ||
    summary.stepGoalReached;

  return { openItems, summary, mealsDone, waterDone, anythingDone, takenMedications, lastWeight, reached };
}
