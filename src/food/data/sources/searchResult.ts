import type { Tier } from '@food/models/foodEntry';

/** A named amount of a food and what it weighs, e.g. "cup" = 158 g. */
export type Portion = { label: string; grams: number };

/**
 * A food that can be logged.
 * Nutrition values are for `servingLabel`; for database foods this is usually
 * "100 g", while `portions` lists common serving sizes.
 * `tier` is the NOVA-based suggestion; `null` means there was no processing data.
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
  /** Last-used unit and quantity for a previously logged food. `unit` null means grams. */
  /** Number of `servingLabel` units last logged when no measure was used. */
  servings?: number;
  last?: { unit: string | null; quantity: number };
  /** Where it came from: the common-foods list, Open Food Facts or USDA. Unset for your own foods. */
  source?: 'common' | 'off' | 'usda';
  /** The rest of a common food's description, shown under the name: "meat only, cooked, roasted". */
  detail?: string;
  /** How common a food is (1 is the most), used to rank common foods. */
  rank?: number;
};
