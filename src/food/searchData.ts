import type { Tier } from './models';

/** A named amount of a food and what it weighs, e.g. "cup" = 158 g. */
export type Portion = { label: string; grams: number };

/**
 * A food that can be logged, from a food database or from your own log.
 * Nutrition values are for `servingLabel`: for database foods that is always
 * "100 g", with `portions` saying what a cup or a serving weighs. `tier` is the
 * NOVA-derived suggestion; `null` means there was no processing data, so the
 * picker asks instead of guessing.
 */
export type SearchResult = {
  id: string;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tier: Tier | null;
  portions?: Portion[];
  source?: 'off' | 'usda';
};

export const tierPickerOptions: { tier: Tier; label: string }[] = [
  { tier: 1, label: 'Whole' },
  { tier: 3, label: 'Processed' },
  { tier: 4, label: 'Ultra-proc.' },
];
