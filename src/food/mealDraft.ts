import { dayTotals } from './models';
import { stepServings } from './servings';
import {
  MAX_MEAL_ITEMS,
  cleanName,
  findMealByName,
  scaleServings,
  validateMealName,
  type SavedMeal,
  type SavedMealItem,
} from './savedMeals';

// ---------------------------------------------------------------- scaling

export const SCALE_STEP = 0.25;
export const SCALE_MIN = 0.25;
export const SCALE_MAX = 10;

/** Moves a whole-meal scale by one step, within limits. */
export function stepScale(scale: number, direction: 1 | -1): number {
  const next = Math.round((scale + direction * SCALE_STEP) / SCALE_STEP) * SCALE_STEP;
  return Math.min(Math.max(next, SCALE_MIN), SCALE_MAX);
}

/** Totals for a saved meal's items at a scale (1 = as saved). */
export const scaledTotals = (items: SavedMealItem[], scale: number) =>
  dayTotals(items.map((i) => ({ ...i, servings: scaleServings(i.servings, scale) })));

// ------------------------------------------------------------------ drafts

/** A meal being built or edited, before it is saved. `id` is null for a new meal. */
export type MealDraft = {
  id: string | null;
  name: string;
  items: SavedMealItem[];
  /** What the draft started as, to tell whether anything changed. */
  original: string;
};

const fingerprint = (name: string, items: SavedMealItem[]) =>
  JSON.stringify([cleanName(name), items]);

export const emptyDraft = (): MealDraft => ({
  id: null,
  name: '',
  items: [],
  original: fingerprint('', []),
});

export const draftFromMeal = (meal: SavedMeal): MealDraft => ({
  id: meal.id,
  name: meal.name,
  items: meal.items.map((i) => ({ ...i })),
  original: fingerprint(meal.name, meal.items),
});

export const isDraftDirty = (d: MealDraft) =>
  fingerprint(d.name, d.items) !== d.original;

/** A message for the user, or null when the draft can be saved. */
export function validateDraft(d: MealDraft, meals: SavedMeal[]): string | null {
  const problem = validateMealName(d.name);
  if (problem) return problem;
  if (!d.items.length) return 'Add at least one food.';
  const clash = findMealByName(meals, d.name);
  if (clash && clash.id !== d.id) {
    return `You already have a meal called “${clash.name}”.`;
  }
  return null;
}

export const addItem = (items: SavedMealItem[], item: SavedMealItem) =>
  items.length >= MAX_MEAL_ITEMS ? items : [...items, item];

export const removeItemAt = (items: SavedMealItem[], index: number) =>
  items.filter((_, i) => i !== index);

/** Changes one item's servings by `delta`, in quarters and never below a quarter. */
export function stepItemServings(
  items: SavedMealItem[],
  index: number,
  delta: number,
): SavedMealItem[] {
  return items.map((item, i) =>
    i === index
      ? {
          ...item,
          servings: stepServings(item.servings, delta),
        }
      : item,
  );
}
