/**
 * Builds the common-foods list from USDA FoodData Central bulk downloads
 * (public domain): https://fdc.nal.usda.gov/download-datasets
 *
 * Download the JSON versions of "Survey (FNDDS)", "Foundation Foods" and
 * "SR Legacy", unzip them, then:
 *
 *   npx tsx scripts/buildCommonFoods.ts \
 *     --fndds path/to/surveyDownload.json \
 *     --foundation path/to/foundationDownload.json \
 *     --sr path/to/srLegacyDownload.json \
 *     [--out build/commonFoods.json] [--limit 3000]
 *
 * Hand corrections live in scripts/commonFoods/overrides.json. Check the
 * output (and the overrides it couldn't match), then publish it with
 * scripts/publishCommonFoods.ts.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  bulkToCandidate,
  selectCommonFoods,
  type BulkFood,
  type BulkKind,
  type Candidate,
  type Override,
} from './commonFoods/build';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// Each download wraps its foods in a differently named array.
const ARRAY_KEYS: Record<BulkKind, string> = {
  fndds: 'SurveyFoods',
  foundation: 'FoundationFoods',
  sr: 'SRLegacyFoods',
};

function load(kind: BulkKind): Candidate[] {
  const file = arg(kind);
  if (!file) {
    console.warn(`No --${kind} file given; skipping it.`);
    return [];
  }
  const json = JSON.parse(readFileSync(file, 'utf8')) as Record<string, BulkFood[]>;
  const foods = json[ARRAY_KEYS[kind]] ?? [];
  const out = foods.map((f) => bulkToCandidate(f, kind)).filter((c): c is Candidate => !!c);
  console.log(`${kind}: ${out.length} of ${foods.length} foods kept`);
  return out;
}

const overrides = JSON.parse(
  readFileSync(join(__dirname, 'commonFoods', 'overrides.json'), 'utf8'),
) as Override[];
const candidates = [...load('fndds'), ...load('foundation'), ...load('sr')];
const { foods, unmatched } = selectCommonFoods(candidates, overrides, Number(arg('limit') ?? 3000));

const out = arg('out') ?? 'build/commonFoods.json';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(foods));

const suggested = foods.filter((f) => f.tier !== null).length;
console.log(`Wrote ${foods.length} foods to ${out} (${suggested} with a suggested type).`);
if (unmatched.length) console.warn(`Overrides that matched nothing: ${unmatched.join(', ')}`);
