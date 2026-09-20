import { getJson } from './http';
import type { Portion, SearchResult } from './searchData';

/**
 * USDA FoodData Central (public domain): everyday foods with household
 * portions, e.g. "medium apple = 161 g", "cup of cooked rice = 158 g".
 * Branded products are deliberately not searched; packaged foods and barcodes
 * come from Open Food Facts. Needs a free API key (EXPO_PUBLIC_USDA_API_KEY);
 * without one this source is simply off.
 */
const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
const PAGE_SIZE = 15;
const MAX_PORTIONS = 8;

export const isUsdaEnabled = () => Boolean(process.env.EXPO_PUBLIC_USDA_API_KEY);

/** A portion as USDA sends it: `foodMeasures` in search results, `foodPortions` in a food's details. */
export type UsdaMeasure = {
  disseminationText?: string;
  modifier?: string;
  portionDescription?: string;
  gramWeight?: number | string;
  amount?: number | string;
  rank?: number;
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
  foodNutrients?: UsdaNutrient[];
  foodMeasures?: UsdaMeasure[];
  foodPortions?: UsdaMeasure[];
};

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};
const round1 = (n: number) => Math.round(n * 10) / 10;

// USDA identifies nutrients by id and by the older "nutrient number".
// Foundation foods often report energy as an Atwater estimate instead of 1008.
const KCAL = { ids: [1008, 2047, 2048], numbers: ['208', '957', '958'] };
const PROTEIN = { ids: [1003], numbers: ['203'] };
const FAT = { ids: [1004], numbers: ['204'] };
const CARBS = { ids: [1005], numbers: ['205'] };
const KJ = { ids: [1062], numbers: ['268'] };

function nutrient(list: UsdaNutrient[], want: { ids: number[]; numbers: string[] }): number | undefined {
  for (const id of want.ids) {
    const hit = list.find((n) => n.nutrientId === id);
    const v = num(hit?.value);
    if (v !== undefined) return v;
  }
  for (const no of want.numbers) {
    const hit = list.find((n) => n.nutrientNumber !== undefined && String(n.nutrientNumber) === no);
    const v = num(hit?.value);
    if (v !== undefined) return v;
  }
  return undefined;
}

const JUNK_LABEL =
  /^(undetermined|quantity not specified|not specified|n\/?a|regular|\d+\s+quantity not specified)$/i;

/** A leading quantity such as "1", "2", "0.5", "1/2" or "1 1/2", and what follows it. */
function splitLeadingAmount(text: string): { amount: number; rest: string } | null {
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
 */
export function measureToPortion(m: UsdaMeasure): Portion | null {
  const grams = num(m.gramWeight);
  if (grams === undefined || grams <= 0 || grams > 5000) return null;
  const unit = m.measureUnit?.name ?? m.measureUnitName;
  const modifier = (m.modifier ?? '').trim();

  const candidates = [
    m.disseminationText,
    m.portionDescription,
    /^\d+$/.test(modifier) ? undefined : modifier, // a bare number is a code, not a name
    unit,
  ];
  const text = candidates
    .map((c) => (c ?? '').trim())
    .find((c) => c && !JUNK_LABEL.test(c));
  if (!text) return null;

  // "2 slices = 56 g" is a portion of one slice weighing 28 g. Without a
  // quantity in the text, `amount` (if any) says how many the weight covers.
  const lead = splitLeadingAmount(text);
  const amount = lead ? lead.amount : (num(m.amount) ?? 1);
  const label = lead ? lead.rest : text;
  const per = amount > 0 ? grams / amount : grams;
  return { label, grams: round1(per) };
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
  const kcal = nutrient(list, KCAL) ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (kcal === undefined || kcal < 0 || kcal > 950) return null;

  const seen = new Set<string>();
  const portions: Portion[] = [];
  for (const m of [...(f.foodMeasures ?? []), ...(f.foodPortions ?? [])].sort(
    (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
  )) {
    const p = measureToPortion(m);
    const key = p ? `${p.label.toLowerCase()}|${p.grams}` : '';
    if (p && !seen.has(key)) {
      seen.add(key);
      portions.push(p);
    }
    if (portions.length >= MAX_PORTIONS) break;
  }

  return {
    id: `usda-${f.fdcId}`,
    name,
    servingLabel: '100 g',
    calories: Math.round(kcal),
    protein: round1(nutrient(list, PROTEIN) ?? 0),
    carbs: round1(nutrient(list, CARBS) ?? 0),
    fat: round1(nutrient(list, FAT) ?? 0),
    tier: null,
    portions: portions.length ? portions : undefined,
    source: 'usda',
  };
}

/** Everyday-food search with the configured key. Resolves to nothing when there isn't one. */
export function searchUsda(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
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
  for (const food of json.foods ?? []) {
    const r = usdaFoodToResult(food);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}
