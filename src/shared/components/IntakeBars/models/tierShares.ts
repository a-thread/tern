import type { FoodEntry } from '@/domain/food/models/foodEntry';

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
  /** Servings logged in this group. */
  servings: number;
  /**
   * 0 to 1 of the day's food: by calories when any were recorded, otherwise by servings (someone
   * tracking processing levels without calories logs foods with no energy). 0 for every group
   * when nothing is logged.
   */
  share: number;
};

/** How a day's food splits across processing groups. Information only: there are no targets. */
export function tierShares(
  log: readonly Pick<FoodEntry, 'tier' | 'calories' | 'servings'>[],
): TierShare[] {
  const per = TierGroups.ALL.map((g) => {
    const inGroup = log.filter((f) => g.tiers.includes(f.tier));
    return {
      ...g,
      calories: inGroup.reduce((sum, f) => sum + f.calories * f.servings, 0),
      servings: inGroup.reduce((sum, f) => sum + f.servings, 0),
    };
  });
  const totalCalories = per.reduce((sum, g) => sum + g.calories, 0);
  const totalServings = per.reduce((sum, g) => sum + g.servings, 0);
  return per.map((g) => ({
    ...g,
    share:
      totalCalories > 0
        ? g.calories / totalCalories
        : totalServings > 0
          ? g.servings / totalServings
          : 0,
  }));
}
