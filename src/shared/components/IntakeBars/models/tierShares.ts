import type { FoodEntry } from '@/domain/food/models/foodEntry';
import { TierGroups, type TierGroup } from '@/domain/food/models/tierGroups';

export type TierShare = TierGroup & {
  calories: number;
  /** 0 to 1 of the day's food; 0 for every group when nothing is logged. */
  share: number;
};

/**
 * How a day's food splits across processing groups. Information only: there are no targets.
 * Weighted by calories while they're tracked; otherwise by servings, since foods logged without
 * calorie tracking may have no energy recorded.
 */
export function tierShares(
  log: readonly Pick<FoodEntry, 'tier' | 'calories' | 'servings'>[],
  byCalories: boolean,
): TierShare[] {
  const weight = (f: (typeof log)[number]) =>
    byCalories ? f.calories * f.servings : f.servings;
  const per = TierGroups.ALL.map((g) => {
    const inGroup = log.filter((f) => g.tiers.includes(f.tier));
    return {
      ...g,
      calories: inGroup.reduce((sum, f) => sum + f.calories * f.servings, 0),
      weight: inGroup.reduce((sum, f) => sum + weight(f), 0),
    };
  });
  const total = per.reduce((sum, g) => sum + g.weight, 0);
  return per.map(({ weight: w, ...g }) => ({
    ...g,
    share: total > 0 ? w / total : 0,
  }));
}
