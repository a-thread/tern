import type { Tier } from './foodEntry';

export type TierGroup = {
  key: 'whole' | 'processed' | 'ultra';
  label: string;
  /** The label where space is tight, like the food-type picker's buttons. */
  shortLabel: string;
  /** NOVA tiers logged as this food type; the first is the one the picker saves. */
  tiers: readonly Tier[];
};

/** The food types a NOVA tier is shown and picked as: Whole (1–2), Processed (3), Ultra-processed (4). */
export class TierGroups {
  static readonly ALL: readonly TierGroup[] = [
    { key: 'whole', label: 'Whole', shortLabel: 'Whole', tiers: [1, 2] },
    {
      key: 'processed',
      label: 'Processed',
      shortLabel: 'Processed',
      tiers: [3],
    },
    {
      key: 'ultra',
      label: 'Ultra-processed',
      shortLabel: 'Ultra-proc.',
      tiers: [4],
    },
  ];
}

/** The food type a tier is logged as. */
export function tierGroupOf(tier: Tier): TierGroup {
  return TierGroups.ALL.find((g) => g.tiers.includes(tier))!;
}

/** "Whole, NOVA 1 or 2": the group with its tiers, for screen readers. */
export function tierGroupA11yLabel(group: TierGroup): string {
  return `${group.label}, NOVA ${group.tiers.join(' or ')}`;
}
