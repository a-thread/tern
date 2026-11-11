import type { Dish } from './ternary';

/**
 * A friend's recipe you kept from the recipe swap: its name, its foods and who shared it.
 * Never amounts or numbers: you cook it, and log it, your own way. Kept on your side, so it
 * stays if the friend leaves or you do.
 */
export type KeptRecipe = {
  /** The dish it was kept from. */
  id: string;
  name: string;
  foods: string[];
  fromName: string;
};

export class RecipeSwapLimits {
  /** Kept recipes are a short list, not an archive. */
  static readonly MAX_KEPT = 50;
}

/** Keeps a dish, newest first; keeping one already kept changes nothing. */
export function keepRecipe(kept: readonly KeptRecipe[], dish: Dish): KeptRecipe[] {
  if (kept.some((k) => k.id === dish.id)) return [...kept];
  return [
    { id: dish.id, name: dish.name, foods: [...dish.foods], fromName: dish.fromName },
    ...kept,
  ].slice(0, RecipeSwapLimits.MAX_KEPT);
}

export const unkeepRecipe = (kept: readonly KeptRecipe[], id: string) =>
  kept.filter((k) => k.id !== id);

export const isKept = (kept: readonly KeptRecipe[], id: string) =>
  kept.some((k) => k.id === id);
