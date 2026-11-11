import { round1, toFiniteNumber } from '@shared/utils/number';
import type { Tier } from '@/domain/food/models/foodEntry';
import { servingPortion } from '@/domain/food/models/servingText';
import { isVolumeAmount } from '@/domain/food/models/volume';
import { getJson } from '@/domain/food/sources/http';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { FoodSource } from '@/domain/food/models/foodSource';
import {
  isFoodApiLogOn,
  logFoodApi,
  portionsText,
} from '@/domain/food/sources/foodApiLog';

/**
 * Open Food Facts client: text search and barcode lookup. Data is used under
 * the Open Database License. OFF asks apps to identify themselves in the
 * User-Agent, and to be gentle with search (see useFoodSearch's debounce).
 */
const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS =
  'code,product_name,brands,quantity,serving_size,serving_quantity,nutriments,nova_group';
const USER_AGENT = 'Tern/0.1 (aiden.threadgoode@gmail.com)';
const PAGE_SIZE = 25;
// Search is a typing aid: past this, the rest of the list is more useful than waiting.
const SEARCH_TIMEOUT_MS = 6000;

export type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  /** The package size: "330 ml", "1 l", "200 g". */
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
  nova_group?: number | string;
};

function firstBrand(brands: OffProduct['brands']): string | undefined {
  const first = Array.isArray(brands) ? brands[0] : brands?.split(',')[0];
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Maps one OFF product to a loggable food, or null if it has no name or no
 * usable calorie figure (there's nothing to log from it). Nutrition in OFF is
 * per 100 g and stays that way; a serving the product declares in grams
 * becomes a portion.
 */
export function productToResult(p: OffProduct): SearchResult | null {
  const name = (p.product_name ?? '').trim();
  if (!name) return null;

  const n = p.nutriments ?? {};
  const kj =
    toFiniteNumber(n['energy-kj_100g']) ?? toFiniteNumber(n['energy_100g']);
  const kcal100 =
    toFiniteNumber(n['energy-kcal_100g']) ??
    (kj !== undefined ? kj / 4.184 : undefined);
  // No energy figure, or an impossible one (pure fat is ~900 kcal per 100 g).
  if (kcal100 === undefined || kcal100 < 0 || kcal100 > 950) return null;

  const grams = toFiniteNumber(p.serving_quantity);
  const portions =
    grams !== undefined && grams > 0 && grams <= 2000
      ? [servingPortion(p.serving_size, grams)]
      : undefined;

  const nova = toFiniteNumber(p.nova_group);
  const tier =
    nova !== undefined && [1, 2, 3, 4].includes(nova) ? (nova as Tier) : null;

  return {
    id: p.code ?? `${name}-${kcal100}`,
    name,
    brand: firstBrand(p.brands),
    servingLabel: '100 g',
    calories: Math.round(kcal100),
    protein: round1(toFiniteNumber(n['proteins_100g']) ?? 0),
    carbs: round1(toFiniteNumber(n['carbohydrates_100g']) ?? 0),
    fat: round1(toFiniteNumber(n['fat_100g']) ?? 0),
    tier,
    portions,
    liquid:
      isVolumeAmount(p.serving_size) || isVolumeAmount(p.quantity) || undefined,
    source: FoodSource.Off,
  };
}

/** What a product said about its serving, and the portions we made of it, for the development log. */
function productLogLine(p: OffProduct): string {
  const r = productToResult(p);
  return (
    `${p.product_name ?? '?'} | ${firstBrand(p.brands) ?? ''}${r ? '' : ' (dropped)'}\n` +
    `      sent: serving_size=${JSON.stringify(p.serving_size)} serving_quantity=${JSON.stringify(p.serving_quantity)} quantity=${JSON.stringify(p.quantity)}\n` +
    `      kept: ${portionsText(r?.portions)}`
  );
}

async function runSearch(
  q: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&page_size=${PAGE_SIZE}&langs=en&fields=${FIELDS}`;
  const json = (await getJson(
    url,
    signal,
    { 'User-Agent': USER_AGENT },
    undefined,
    SEARCH_TIMEOUT_MS,
  )) as {
    hits?: OffProduct[];
  };
  // The same product is often listed under several barcodes; show it once.
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  logFoodApi(
    `Open Food Facts search "${q}": ${json.hits?.length ?? 0} products`,
    isFoodApiLogOn() ? (json.hits ?? []).map(productLogLine) : [],
  );
  for (const hit of json.hits ?? []) {
    const r = productToResult(hit);
    if (!r) continue;
    const key = `${r.name}|${r.brand ?? ''}|${r.calories}`.toLowerCase();
    if (seen.has(r.id) || seen.has(key)) continue;
    seen.add(r.id);
    seen.add(key);
    out.push(r);
  }
  return out;
}

/**
 * Text search. Results without usable nutrition are dropped, and duplicates by
 * barcode removed.
 *
 * Open Food Facts matches the query against translated names too, and most of
 * its products are French, so "apple" would otherwise return page after page of
 * "Pommes…". Products whose own language is English come first (`lang:en`); only
 * if there are none, and `fallback` allows it, do we search everything, e.g. for
 * a foreign dish name. The caller turns the fallback off when other sources
 * already answered the query, which saves a second, slow request.
 */
export async function searchProducts(
  query: string,
  signal?: AbortSignal,
  { fallback = true }: { fallback?: boolean } = {},
): Promise<SearchResult[]> {
  // Colons, quotes and brackets are search syntax; typed text mustn't change the filter.
  const text = query
    .replace(/[:"()\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return [];
  const english = await runSearch(`${text} lang:en`, signal);
  return english.length || !fallback ? english : runSearch(text, signal);
}

export type BarcodeLookup =
  | { status: 'found'; result: SearchResult }
  /** The product exists but has no calorie data, so it can't be logged as-is. */
  | { status: 'no-nutrition'; name: string }
  | { status: 'not-found' };

/** Barcodes are 8–14 digits (EAN-8, UPC-A, EAN-13, ITF-14). */
export const isValidBarcode = (code: string) => /^\d{8,14}$/.test(code.trim());

export async function getProductByBarcode(
  code: string,
  signal?: AbortSignal,
): Promise<BarcodeLookup> {
  const clean = code.trim();
  if (!isValidBarcode(clean)) return { status: 'not-found' };
  const json = (await getJson(
    `${PRODUCT_URL}/${clean}.json?fields=${FIELDS}`,
    signal,
    { 'User-Agent': USER_AGENT },
  )) as {
    status?: number;
    product?: OffProduct;
  };
  logFoodApi(
    `Open Food Facts barcode ${clean}`,
    !isFoodApiLogOn()
      ? []
      : json.product
        ? [productLogLine(json.product)]
        : ['not found'],
  );
  if (json.status === 0 || !json.product) return { status: 'not-found' };
  const result = productToResult({
    ...json.product,
    code: json.product.code ?? clean,
  });
  if (result) return { status: 'found', result };
  const name = (json.product.product_name ?? '').trim();
  return name ? { status: 'no-nutrition', name } : { status: 'not-found' };
}

/**
 * A product's declared serving, looked up by its code. Search leaves serving sizes out of
 * its results, so they are fetched when a product found by searching is opened.
 */
export async function getProductPortions(
  code: string,
  signal?: AbortSignal,
): Promise<Pick<SearchResult, 'portions' | 'liquid'>> {
  const found = await getProductByBarcode(code, signal);
  if (found.status !== 'found') return {};
  return { portions: found.result.portions, liquid: found.result.liquid };
}
