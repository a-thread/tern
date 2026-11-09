import { ozToMl } from '@shared/utils/units';
import type { Portion } from '../sources/searchResult';

/**
 * Drinks can be measured by volume as well as by weight. These are the two
 * volume units offered for them; each is stored as a portion like any other
 * ("ml" = 1.03 g for milk), so an amount in ml is still a weight underneath.
 */
export enum VolumeUnit {
  Ml = 'ml',
  FlOz = 'fl oz',
}

/** How volumes step in a stepper, and the least one can log. */
export class VolumeSteps {
  static readonly ML_STEP = 10;

  static readonly ML_MIN = 5;

  static readonly FL_OZ_STEP = 1;

  static readonly FL_OZ_MIN = 0.5;
}

/** Words that make a food a drink (or close enough to pour). */
export const LIQUID_WORDS =
  /\b(milk|juice|coffee|tea|water|soda|cola|beer|wine|drink|smoothie|kombucha|lemonade|broth|shake|nectar)\b/i;

// Foods that share a drink's word but aren't poured: milk chocolate, a tea biscuit, water chestnuts.
const NOT_POURED =
  /\b(milk chocolate|bars?|cakes?|cookies?|biscuits?|bread|powder(ed)?|cereal|candy|crackers?|chips?|ice cream|chestnuts?|crisps?|dry)\b/i;

const ML_PER_FL_OZ = ozToMl(1);

// Household volumes that say how dense a food is: a cup of milk weighs 244 g, so 1 ml is 1.03 g.
const KNOWN_VOLUMES: [RegExp, number][] = [
  [/^(ml|millilit(er|re)s?)$/i, 1],
  [/^(fl\.? ?oz|fluid ounces?)$/i, ML_PER_FL_OZ],
  [/^cups?$/i, ML_PER_FL_OZ * 8],
  [/^(tbsp|tablespoons?)$/i, ML_PER_FL_OZ / 2],
  [/^(tsp|teaspoons?)$/i, ML_PER_FL_OZ / 6],
  [/^(l|lit(er|re)s?)$/i, 1000],
];

// A declared serving given in a volume ("330 ml", "1 l", "12 fl oz").
const VOLUME_AMOUNT = /\d\s*(ml|cl|dl|l|fl\.? ?oz)\b/i;

/** A cup or spoon ("cup", "cup, chopped", "tbsp"): measured in quarters, unlike things counted whole. */
export const isHouseholdVolume = (label: string) =>
  /^(cups?|tbsp|tsp|tablespoons?|teaspoons?)\b/i.test(label.trim());

export const isVolumeUnit = (unit: string | null): unit is VolumeUnit =>
  unit === VolumeUnit.Ml || unit === VolumeUnit.FlOz;

/** Whether a serving or package size is written as a volume, as Open Food Facts lists drinks. */
export const isVolumeAmount = (text: string | undefined) =>
  !!text && VOLUME_AMOUNT.test(text);

/** The millilitres a portion label names ("cup", "2 tbsp"), or null if it isn't a volume. */
function mlOf(label: string): number | null {
  const m = /^(\d+(?:[.,]\d+)?)?\s*(.+)$/.exec(label.trim());
  if (!m) return null;
  const count = m[1] ? parseFloat(m[1].replace(',', '.')) : 1;
  const unit = KNOWN_VOLUMES.find(([re]) => re.test(m[2].trim()));
  return unit && count > 0 ? unit[1] * count : null;
}

/**
 * Grams per millilitre, from the first portion that is a known volume. Water
 * (1 g/ml) when there is none, or when the figure is implausible for a drink.
 */
export function gramsPerMl(portions: Portion[]): number {
  for (const p of portions) {
    const ml = mlOf(p.label);
    if (ml === null) continue;
    const density = p.grams / ml;
    return density >= 0.5 && density <= 2 ? density : 1;
  }
  return 1;
}

/**
 * Whether a food is a drink: the source said so (`hint`), it already comes in
 * fluid ounces or ml, or its name says it ("Orange juice", "Milk, whole").
 */
export function isLiquid(
  name: string,
  portions: Portion[],
  hint?: boolean,
): boolean {
  if (hint) return true;
  if (portions.some((p) => isVolumeUnit(p.label))) return true;
  return LIQUID_WORDS.test(name) && !NOT_POURED.test(name);
}

/**
 * The portions with fl oz and ml added for a drink, after its own ("cup",
 * "can"). Anything else is returned as it is.
 */
export function withVolumes(
  portions: Portion[],
  name: string,
  hint?: boolean,
): Portion[] {
  if (!isLiquid(name, portions, hint)) return portions;
  const density = gramsPerMl(portions);
  const has = (unit: VolumeUnit) => portions.some((p) => p.label === unit);
  const added: Portion[] = [];
  if (!has(VolumeUnit.FlOz))
    added.push({
      label: VolumeUnit.FlOz,
      grams: Math.round(ML_PER_FL_OZ * density * 10) / 10,
    });
  if (!has(VolumeUnit.Ml))
    added.push({
      label: VolumeUnit.Ml,
      grams: Math.round(density * 1000) / 1000,
    });
  return added.length ? [...portions, ...added] : portions;
}
