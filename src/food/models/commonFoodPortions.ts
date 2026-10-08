import type { Portion } from '@food/data/sources/searchResult';
import { singular } from './measure';

/**
 * Picks the portions people actually use for a common food, in the order to
 * offer them (the first is the default):
 *  - sizes and whole items first ("medium apple", "avocado"),
 *  - a cup first for small things ("blueberry" is too small to be the default),
 *  - a cup first for drinks, a tablespoon for oils, butter and spreads,
 *  - ounces for cheese, nuts, meat and fish (added when USDA has none).
 * Used when the common-foods list is built.
 */

export type PortionKind = 'size' | 'count' | 'volume' | 'weight';

// Packaging, guidelines, brands and odd measures nobody logs by.
const JUNK =
  /\b(nlea|single serving|serving package|100 calorie|package|guideline|cubic inch|linear inch|as purchased|yields|bunch|quantity not specified|racc|school|box|pouch|envelope|microwavable|spaghettio'?s|dannon|cracker jack|without refuse|without skin and seeds|ns as to|pot)\b/i;

const SIZE = /^(extra small|small|medium|large|extra large|jumbo)\b/i;
const SIZE_ORDER = ['medium', 'small', 'large', 'extra small', 'extra large', 'jumbo'];
const VOLUME = /^(cups?|tbsp|tablespoons?|tsp|teaspoons?|fl oz|fluid ounces?|pint|quart)\b/i;
const SPOON = /^(tbsp|tablespoons?|tsp|teaspoons?)\b/i;
const WEIGHT = /^(oz|ounces?|g|grams?|lbs?|pounds?)\b/i;
const VOLUME_ORDER = [/^cup/i, /^(tbsp|tablespoon)/i, /^(tsp|teaspoon)/i, /^fl oz/i];

// A single item named generically: "1 fruit" of an orange is "1 orange".
const GENERIC_ITEM = /^(fruit|berry|berries|whole|item|each|regular)$/i;

// Below this, one item is too small to be the default ("1 blueberry"); a cup is.
const SMALL_ITEM_GRAMS = 30;

const LIQUID =
  /\b(milk|juice|coffee|tea|water|soda|cola|beer|wine|drink|smoothie|kombucha|lemonade|broth|shake|nectar)\b/i;
const SPOONED =
  /\b(oil|butter|honey|syrup|jam|jelly|mayonnaise|mayo|dressing|sauce|ketchup|mustard|sugar|salsa|hummus|spread)\b/i;
const OUNCE_FIRST =
  /\b(cheese|almonds?|walnuts?|cashews?|pecans?|pistachios?|peanuts|hazelnuts?|macadamias?|nuts|seeds|ground beef|ground turkey|salmon|tuna|cod|tilapia|fish|shrimp|steak)\b/i;
const MEAT = /\b(beef|pork|lamb|chicken|turkey|veal|duck)\b/i;

const OUNCE: Portion = { label: 'oz', grams: 28.35 };

const SERVED = /^(glass|can|bottle|can or bottle|mug)$/i;

// Heavier than this, "one whole" is a thing you share, not a serving.
const WHOLE_MAX_GRAMS = 400;

export function portionKind(label: string): PortionKind {
  if (SIZE.test(label)) return 'size';
  if (VOLUME.test(label)) return 'volume';
  if (WEIGHT.test(label)) return 'weight';
  return 'count';
}

/**
 * A portion label made readable, or null to drop it: dimensions in brackets go
 * ("large (8" long)" → "large"), a bare size or generic item gets the food's
 * noun ("medium" → "medium apple", "medium whole" → "medium tomato",
 * "fruit" → "orange"), and a plural count reads as one ("berries" → "berry").
 */
export function tidyPortionLabel(label: string, noun: string | null): string | null {
  if (JUNK.test(label)) return null;
  let l = label
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
    .toLowerCase();
  // A bare dimension ('2-7/8" dia') names nothing.
  if (!l || /^[\d"]/.test(l)) return null;
  // "oz, cooked" is an ounce like any other.
  if (WEIGHT.test(l)) l = l.split(',')[0].trim();
  if (noun) {
    const rest = l.replace(SIZE, '').trim();
    if (SIZE.test(l) && (rest === '' || GENERIC_ITEM.test(rest))) l = `${SIZE.exec(l)![1]} ${noun}`;
    else if (GENERIC_ITEM.test(l)) l = noun;
  }
  return portionKind(l) === 'count' && !/\s/.test(l) ? singular(l) : l;
}

const sizeRank = (label: string) => {
  const word = SIZE.exec(label)?.[1]?.toLowerCase() ?? '';
  const i = SIZE_ORDER.indexOf(word);
  return i < 0 ? SIZE_ORDER.length : i;
};
const volumeRank = (label: string, spoonFirst: boolean) => {
  const i = VOLUME_ORDER.findIndex((re) => re.test(label));
  const base = i < 0 ? VOLUME_ORDER.length : i;
  // Plain "cup" before "cup, sliced"; spoons before cups for oils and spreads.
  return (spoonFirst && SPOON.test(label) ? -1 : base) * 100 + label.length;
};

export function typicalPortions(
  portions: Portion[],
  foodName: string,
  noun: string | null,
  max = 6,
): Portion[] {
  const seen = new Set<string>();
  const tidy: Portion[] = [];
  for (const p of portions) {
    const label = tidyPortionLabel(p.label, noun);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    // An ounce is an ounce: USDA's "1 oz raw" of bacon weighs 8 g once cooked.
    tidy.push({ label, grams: label === 'oz' ? OUNCE.grams : p.grams });
  }
  // "Serving" is the dataset's reference amount: only worth offering when it's all there is.
  const real = tidy.filter((p) => p.label !== 'serving');
  const list = real.length ? real : tidy;

  const liquid = LIQUID.test(foodName);
  const spooned = SPOONED.test(foodName);
  const ounceFirst = OUNCE_FIRST.test(foodName);
  const meat = MEAT.test(foodName);

  // The whole thing ("avocado", a chicken "breast") before its pieces ("slice"), as long as
  // it's a single serving: a whole 900 g pineapple isn't what anyone means by one.
  const cut = noun?.split(' ').pop() ?? null;
  const isWhole = (p: Portion) => (p.label === noun || p.label === cut) && p.grams <= WHOLE_MAX_GRAMS;

  const of = (k: PortionKind) => list.filter((p) => portionKind(p.label) === k);
  const sizes = of('size').sort((a, b) => sizeRank(a.label) - sizeRank(b.label));
  const counts = of('count').sort((a, b) => Number(isWhole(b)) - Number(isWhole(a)));
  const volumes = of('volume').sort((a, b) => volumeRank(a.label, spooned) - volumeRank(b.label, spooned));
  const weights = of('weight');
  if ((ounceFirst || meat) && !weights.some((w) => w.label === 'oz')) weights.unshift(OUNCE);
  // Drinks are logged by the cup: eight fluid ounces when USDA only gives one.
  const flOz = volumes.find((v) => v.label === 'fl oz');
  if (liquid && flOz && !volumes.some((v) => /^cup/.test(v.label))) {
    volumes.unshift({ label: 'cup', grams: Math.round(flOz.grams * 8 * 10) / 10 });
  }

  // A whole item is as typical as a medium one when there are no sizes.
  const whole = counts.find(isWhole);
  const typical = sizes[0] ?? whole ?? counts[0];
  // Slices (bacon, bread, cheese) are how people count even when each is light.
  const small = typical !== undefined && typical.grams < SMALL_ITEM_GRAMS && !/\bslice\b/.test(typical.label);
  // Drinks served in their own container: a glass of wine, a can of beer.
  const served = liquid ? counts.filter((c) => SERVED.test(c.label) && c.grams <= WHOLE_MAX_GRAMS) : [];

  let ordered: Portion[];
  if (ounceFirst) ordered = [...weights, ...sizes, ...counts, ...volumes];
  else if (meat) {
    // Sized cuts ("medium breast") and the whole cut ("breast") first, then ounces, then
    // slices and the rest.
    const cutSizes = sizes.filter((s) => cut !== null && s.label.endsWith(cut));
    const otherSizes = sizes.filter((s) => !cutSizes.includes(s));
    const rest = counts.filter((c) => c !== whole);
    ordered = [...cutSizes, ...(whole ? [whole] : []), ...weights, ...otherSizes, ...rest, ...volumes];
  }
  else if (served.length) ordered = [...served, ...volumes, ...sizes, ...counts.filter((c) => !served.includes(c)), ...weights];
  else if (liquid || spooned || small || !typical) ordered = [...volumes, ...sizes, ...counts, ...weights];
  else if (whole && !sizes.some((s) => /^medium\b/.test(s.label))) ordered = [whole, ...sizes, ...counts.filter((c) => c !== whole), ...volumes, ...weights];
  else ordered = [...sizes, ...counts, ...volumes, ...weights];
  // Nothing big enough to share leads the list: a whole pizza, a melon, a bottle of wine.
  const fits = ordered.filter((p) => p.grams <= WHOLE_MAX_GRAMS);
  const big = ordered.filter((p) => p.grams > WHOLE_MAX_GRAMS);
  return [...fits, ...big].slice(0, max);
}
