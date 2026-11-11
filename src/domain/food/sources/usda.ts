import { round1, toFiniteNumber } from '@shared/utils/number';
import { getJson } from './http';
import { nounFor } from '../models/measure';
import type { Portion, SearchResult } from './searchResult';
import { FoodSource } from '../models/foodSource';
import { isFoodApiLogOn, logFoodApi, portionsText } from './foodApiLog';

/**
 * USDA FoodData Central (public domain): everyday foods with household
 * portions, e.g. "medium apple = 161 g", "cup of cooked rice = 158 g".
 * Branded products are deliberately not searched; packaged foods and barcodes
 * come from Open Food Facts. Needs a free API key (EXPO_PUBLIC_USDA_API_KEY);
 * without one this source is simply off.
 */
const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const DETAIL_URL = 'https://api.nal.usda.gov/fdc/v1/food';
const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
const PAGE_SIZE = 15;
const MAX_PORTIONS = 8;

export const isUsdaEnabled = () =>
  Boolean(process.env.EXPO_PUBLIC_USDA_API_KEY);

/** A portion as USDA sends it: `foodMeasures` in search results, `foodPortions` in a food's details. */
export type UsdaMeasure = {
  disseminationText?: string;
  modifier?: string;
  portionDescription?: string;
  gramWeight?: number | string;
  amount?: number | string;
  rank?: number;
  /** A food's details order their portions by this instead of `rank`. */
  sequenceNumber?: number;
  measureUnit?: { name?: string };
  measureUnitName?: string;
};

export type UsdaNutrient = {
  nutrientId?: number;
  nutrientNumber?: string | number;
  value?: number | string;
  unitName?: string;
};

export type UsdaFood = {
  fdcId?: number;
  description?: string;
  /** "Foundation", "SR Legacy" or "Survey (FNDDS)". */
  dataType?: string;
  foodNutrients?: UsdaNutrient[];
  foodMeasures?: UsdaMeasure[];
  foodPortions?: UsdaMeasure[];
};

// USDA identifies nutrients by id and by the older "nutrient number".
// Foundation foods often report energy as an Atwater estimate instead of 1008.
const KCAL = { ids: [1008, 2047, 2048], numbers: ['208', '957', '958'] };
const PROTEIN = { ids: [1003], numbers: ['203'] };
const FAT = { ids: [1004], numbers: ['204'] };
const CARBS = { ids: [1005], numbers: ['205'] };
const KJ = { ids: [1062], numbers: ['268'] };

function nutrient(
  list: UsdaNutrient[],
  want: { ids: number[]; numbers: string[] },
): number | undefined {
  for (const id of want.ids) {
    const hit = list.find((n) => n.nutrientId === id);
    const v = toFiniteNumber(hit?.value);
    if (v !== undefined) return v;
  }
  for (const no of want.numbers) {
    const hit = list.find(
      (n) => n.nutrientNumber !== undefined && String(n.nutrientNumber) === no,
    );
    const v = toFiniteNumber(hit?.value);
    if (v !== undefined) return v;
  }
  return undefined;
}

// A size on its own says nothing: "1 large" is a large egg, not a large anything.
const SIZE_WORD =
  /^(small|medium|large|extra large|extra-large|jumbo|x-large)$/i;

const JUNK_LABEL = /^(undetermined|not specified|n\/?a|regular)$/i;

// USDA's ways of saying "a usual serving": its typical amount ("Quantity not specified"), the
// label serving (NLEA) and the reference amount (RACC). All become one "serving".
const SERVING_LABEL =
  /^(serving\b.*|nlea serving|racc|quantity not specified|\d+\s+quantity not specified)$/i;

// Unit names that aren't a unit to show: USDA's placeholder, and RACC (read as a serving).
const NOT_A_UNIT = /^(undetermined|racc)$/i;

// Rows that aren't an amount anyone measures out: dietary guideline figures ("per fl oz of
// beverage" = 2.5 g of milk), cooked yields ("1 oz yields" = 20 g), cubic inches, drinks
// poured over ice, and ounces, which every food already has as a weight.
const NOT_A_PORTION =
  /^guideline amount|\byields?\b|\bcubic inch|\bwith ice\b|^(oz|ounces?)\b/i;

/**
 * Drops USDA's "not further specified" notes ("breast, NS as to size" → "breast", "fl oz (NFS)"
 * → "fl oz") and shortens spoons to the app's own words ("tablespoon" → "tbsp").
 */
const withoutNotes = (label: string) =>
  label
    .replace(/\s*\((nfs|no ice)\)/gi, '')
    .replace(/,?\s*\bNS as to [a-z ]+$/i, '')
    .replace(/,\s*NFS$/i, '')
    .replace(/^tablespoons?\b/i, 'tbsp')
    .replace(/^teaspoons?\b/i, 'tsp')
    .trim();

/** A leading quantity such as "1", "2", "0.5", "1/2" or "1 1/2", and what follows it. */
function splitLeadingAmount(
  text: string,
): { amount: number; rest: string } | null {
  const m = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s+(.+)$/.exec(text);
  if (!m) return null;
  const parts = m[1].split(/\s+/);
  const value = parts.reduce((sum, p) => {
    if (p.includes('/')) {
      const [a, b] = p.split('/').map(Number);
      return sum + (b ? a / b : 0);
    }
    return sum + Number(p);
  }, 0);
  return value > 0 ? { amount: value, rest: m[2].trim() } : null;
}

/**
 * One measure to a portion, or null if it has no usable label or weight.
 *
 * Two shapes arrive. Search results carry the whole phrase in
 * `disseminationText` ("1 medium", "1 cup"), and their `modifier` is a numeric
 * code ("62015") that must not be shown. A food's details carry the amount
 * separately and the name in `modifier` ("medium (3" dia)").
 *
 * `noun` ("egg") completes a bare size, so "large" reads as "large egg".
 */
export function measureToPortion(
  m: UsdaMeasure,
  noun?: string | null,
): Portion | null {
  const grams = toFiniteNumber(m.gramWeight);
  if (grams === undefined || grams <= 0 || grams > 5000) return null;
  const unit = (m.measureUnit?.name ?? m.measureUnitName ?? '').trim();
  const modifier = (m.modifier ?? '').trim();
  const realUnit = unit && !NOT_A_UNIT.test(unit) ? unit : '';

  const words = [
    m.portionDescription,
    /^\d+$/.test(modifier) ? undefined : modifier, // a bare number is a code, not a name
  ]
    .map((c) => (c ?? '').trim())
    .find((c) => c && !JUNK_LABEL.test(c));

  // Search results say it all in `disseminationText`. A food's details split it: Foundation
  // foods put the unit in `measureUnit` and how it's cut in the words ("cup" + "chopped").
  let text = (m.disseminationText ?? '').trim();
  if (!text || JUNK_LABEL.test(text)) {
    if (/^racc$/i.test(unit)) text = 'serving';
    else if (realUnit && words && !words.toLowerCase().startsWith(realUnit.toLowerCase()))
      text = `${realUnit}, ${words}`;
    else text = words ?? realUnit;
  }
  if (!text) return null;

  // "2 slices = 56 g" is a portion of one slice weighing 28 g. Without a
  // quantity in the text, `amount` (if any) says how many the weight covers.
  const lead = splitLeadingAmount(text);
  const amount = lead ? lead.amount : (toFiniteNumber(m.amount) ?? 1);
  const named = withoutNotes(lead ? lead.rest : text);
  if (!named || NOT_A_PORTION.test(named)) return null;
  const per = amount > 0 ? grams / amount : grams;
  if (SERVING_LABEL.test(named)) return { label: 'serving', grams: round1(per) };
  const label =
    noun && SIZE_WORD.test(named) ? `${named.toLowerCase()} ${noun}` : named;
  return { label, grams: round1(per) };
}

/**
 * A food's household portions in USDA's order, without duplicates. Its usual serving comes
 * last, and only when no other portion already weighs the same (a medium apple is the serving).
 */
export function usdaPortions(f: UsdaFood): Portion[] {
  const noun = nounFor(f.description ?? '');
  const seen = new Set<string>();
  const portions: Portion[] = [];
  let serving: Portion | null = null;
  const order = (m: UsdaMeasure) => m.rank ?? m.sequenceNumber ?? 999;
  for (const m of [...(f.foodMeasures ?? []), ...(f.foodPortions ?? [])].sort(
    (a, b) => order(a) - order(b),
  )) {
    const p = measureToPortion(m, noun);
    if (!p) continue;
    if (p.label === 'serving') {
      serving ??= p;
      continue;
    }
    const key = `${p.label.toLowerCase()}|${p.grams}`;
    if (!seen.has(key) && portions.length < MAX_PORTIONS) {
      seen.add(key);
      portions.push(p);
    }
  }
  const s = serving;
  if (s && !portions.some((p) => Math.abs(p.grams - s.grams) < 1))
    portions.push(s);
  return portions;
}

/**
 * Maps one USDA food to a loggable one, or null when it has no name or energy
 * figure. Nutrition is per 100 g. USDA has no NOVA processing data, so the food
 * type is left for the user to choose.
 */
export function usdaFoodToResult(f: UsdaFood): SearchResult | null {
  const name = (f.description ?? '').trim();
  if (!name || f.fdcId === undefined) return null;

  const list = f.foodNutrients ?? [];
  const kj = nutrient(list, KJ);
  const kcal =
    nutrient(list, KCAL) ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (kcal === undefined || kcal < 0 || kcal > 950) return null;

  const portions = usdaPortions(f);

  return {
    id: `usda-${f.fdcId}`,
    name,
    servingLabel: '100 g',
    calories: Math.round(kcal),
    // USDA works carbs out "by difference", which can dip just below zero (-0.3 g for lamb).
    protein: round1(Math.max(nutrient(list, PROTEIN) ?? 0, 0)),
    carbs: round1(Math.max(nutrient(list, CARBS) ?? 0, 0)),
    fat: round1(Math.max(nutrient(list, FAT) ?? 0, 0)),
    tier: null,
    portions: portions.length ? portions : undefined,
    source: FoodSource.Usda,
  };
}

/** Everyday-food search with the configured key. Resolves to nothing when there isn't one. */
export function searchUsda(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  return searchUsdaWithKey(query, process.env.EXPO_PUBLIC_USDA_API_KEY, signal);
}

// Takes the key as an argument because Expo inlines EXPO_PUBLIC_* at build time,
// which makes the environment variable itself impossible to vary in a test.
export async function searchUsdaWithKey(
  query: string,
  key: string | undefined,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  if (!key) return [];
  // A POST with a JSON body: the equivalent GET was rejected (HTTP 400) for
  // multi-word queries once the URL grew past a certain length.
  const json = (await getJson(
    `${SEARCH_URL}?api_key=${encodeURIComponent(key)}`,
    signal,
    {},
    { query: query.trim(), dataType: DATA_TYPES, pageSize: PAGE_SIZE },
  )) as { foods?: UsdaFood[] };
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  const log: string[] = [];
  for (const food of json.foods ?? []) {
    const r = usdaFoodToResult(food);
    if (isFoodApiLogOn())
      log.push(
        `[${food.dataType ?? '?'}] ${food.description ?? '?'}${r ? '' : ' (dropped)'}\n` +
          `      sent: ${rawMeasuresText([...(food.foodMeasures ?? []), ...(food.foodPortions ?? [])])}\n` +
          `      kept: ${portionsText(r?.portions)}`,
      );
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  logFoodApi(`USDA search "${query.trim()}": ${out.length} foods`, log);
  return out;
}

/**
 * The portions from a food's details. Search leaves them out for Foundation and SR Legacy
 * foods (broccoli, cheddar), so they are fetched when such a food is opened.
 */
export function getUsdaPortions(
  id: string,
  signal?: AbortSignal,
): Promise<Portion[]> {
  return getUsdaPortionsWithKey(id, process.env.EXPO_PUBLIC_USDA_API_KEY, signal);
}

export async function getUsdaPortionsWithKey(
  id: string,
  key: string | undefined,
  signal?: AbortSignal,
): Promise<Portion[]> {
  const fdcId = /^usda-(\d+)$/.exec(id)?.[1];
  if (!key || !fdcId) return [];
  const food = (await getJson(
    `${DETAIL_URL}/${fdcId}?api_key=${encodeURIComponent(key)}`,
    signal,
  )) as UsdaFood;
  const portions = usdaPortions(food);
  logFoodApi(`USDA details ${fdcId} "${food.description ?? '?'}"`, [
    `sent: ${rawMeasuresText(food.foodPortions ?? [])}`,
    `kept: ${portionsText(portions)}`,
  ]);
  return portions;
}

/** The measures as USDA wrote them, for the development log. */
const rawMeasuresText = (ms: UsdaMeasure[]) =>
  ms.length
    ? ms
        .map((m) => {
          const words =
            m.disseminationText ??
            [
              m.amount,
              m.measureUnit?.name ?? m.measureUnitName,
              m.modifier,
              m.portionDescription,
            ]
              .filter((w) => w !== undefined && w !== '')
              .join(' ');
          return `"${words}" = ${m.gramWeight} g`;
        })
        .join(', ')
    : 'none';
