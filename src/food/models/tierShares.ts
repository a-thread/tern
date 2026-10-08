import type { FoodEntry } from './foodEntry';

export type TierGroup = {
  key: 'whole' | 'processed' | 'ultra';
  label: string;
  /** NOVA tiers that share this color. */
  tiers: readonly FoodEntry['tier'][];
};

/** The food-type groups the logging screens already use: Whole (1-2), Processed (3), Ultra-processed (4). */
export class TierGroups {
  static readonly ALL: readonly TierGroup[] = [
    { key: 'whole', label: 'Whole', tiers: [1, 2] },
    { key: 'processed', label: 'Processed', tiers: [3] },
    { key: 'ultra', label: 'Ultra-processed', tiers: [4] },
  ];
}

export type TierShare = TierGroup & {
  calories: number;
  /** 0 to 1 of the day's calories; 0 for every group when nothing is logged. */
  share: number;
};

/** How a day's calories split across processing groups. Information only: there are no targets. */
export function tierShares(
  log: readonly Pick<FoodEntry, 'tier' | 'calories' | 'servings'>[],
): TierShare[] {
  const per = TierGroups.ALL.map((g) => ({
    ...g,
    calories: log
      .filter((f) => g.tiers.includes(f.tier))
      .reduce((sum, f) => sum + f.calories * f.servings, 0),
  }));
  const total = per.reduce((sum, g) => sum + g.calories, 0);
  return per.map((g) => ({ ...g, share: total > 0 ? g.calories / total : 0 }));
}
