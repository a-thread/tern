import type { Tier } from '../models/foodEntry';
import { FoodSource } from '../models/foodSource';

/** A named amount of a food and what it weighs, e.g. "cup" = 158 g. */
export type Portion = { label: string; grams: number };

/** Nutrition is for `servingLabel` (usually "100 g" for database foods). */
export type SearchResult = {
  id: string;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** NOVA suggestion; null when there was no processing data. */
  tier: Tier | null;
  portions?: Portion[];
  /** `servingLabel` units last logged when no measure was used. */
  servings?: number;
  /** Last-used measure; `unit` null means grams. */
  last?: { unit: string | null; quantity: number };
  /** Unset for your own foods. */
  source?: FoodSource.Common | FoodSource.Off | FoodSource.Usda;
  /** Shown under the name: "meat only, cooked, roasted". */
  detail?: string;
  /** Sold by volume, so fl oz and ml are offered whatever its name. */
  liquid?: boolean;
  /** The database copy to fetch sizes from, for a food you logged before it had any. */
  sizesFrom?: { id: string; source: FoodSource };
  /** 1 is the most common. */
  rank?: number;
};
