import { round1 } from '@shared/utils/number';
import type { Portion } from '../sources/searchResult';
import { singular } from './measure';

// A serving written only as a weight or volume ("30 g", "250 ml") has no name of its own.
const BARE_AMOUNT = /^(g|kg|mg|ml|cl|l|dl)$/i;
// A weight in ounces or pounds ("1 oz (28 g)", "1 onz"): every food already has those, so it's a serving.
const WEIGHT_MEASURE = /^(oz|onz|ounces?|lbs?|pounds?)$/i;
// A household measure, counted in ones: "2 tbsp (32 g)" is a tbsp of 16 g, "0.33 cup (28 g)" a cup of 85 g.
const HOUSEHOLD_MEASURE: [RegExp, string][] = [
  [/^(fl\.? ?oz|fluid ounces?)$/i, 'fl oz'],
  [/^(tsp|teaspoons?)$/i, 'tsp'],
  [/^(tbsp|tablespoons?)$/i, 'tbsp'],
  [/^cups?$/i, 'cup'],
];
// A count and plain words: "2 cookies", "0.5 cup", "1 large bowl".
const COUNTED_WORDS = /^(\d+(?:[.,]\d+)?)\s*([a-z][a-z .-]*)$/i;
// Fractions people type at the start of a serving: "1/2 cup", "½ cup".
const FRACTION = /^(\d+)\s*\/\s*(\d+)/;
const MIXED = /^(\d+)\s+(\d+)\s*\/\s*(\d+)/;
const VULGAR: Record<string, string> = { '½': '0.5', '¼': '0.25', '¾': '0.75' };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "(28 g)" notes dropped and spaces collapsed. */
const withoutNotes = (text: string) =>
  text
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The portion a serving size describes, as a product label writes it. "1 bar (40 g)" is a
 * bar of 40 g, "2 cookies (30 g)" a cookie of 15 g, "2 tbsp (30 g)" a tbsp of 15 g; a bare
 * weight ("30 g", "1 oz") or anything else is just "serving".
 */
export function servingPortion(
  servingSize: string | undefined,
  grams: number,
): Portion {
  const m = COUNTED_WORDS.exec(withoutNotes(servingSize ?? ''));
  if (!m) return { label: 'serving', grams };
  const count = parseFloat(m[1].replace(',', '.'));
  const noun = m[2].trim();
  if (BARE_AMOUNT.test(noun) || WEIGHT_MEASURE.test(noun))
    return { label: 'serving', grams };
  const measure = HOUSEHOLD_MEASURE.find(([re]) => re.test(noun));
  if (measure && count > 0)
    return { label: measure[1], grams: round1(grams / count) };
  // Any count but one is shared out: "2 cookies" is a cookie of 15 g, "1.5 bowls" a bowl of
  // two thirds the weight.
  if (count > 0 && count !== 1) {
    return {
      label: singular(noun.toLowerCase()),
      grams: round1(grams / count),
    };
  }
  return { label: noun.toLowerCase(), grams };
}

/** "cups, chopped" → "cup, chopped": the word before a comma is the one that's counted. */
function singularLabel(label: string): string {
  const comma = label.indexOf(',');
  return comma > 0
    ? `${singular(label.slice(0, comma))}${label.slice(comma)}`
    : singular(label);
}

/**
 * A serving someone typed in, weighing `grams`, as a portion and how many of it: "bowl" is
 * 1 bowl, "1/2 cup" half a cup, "2 cups, chopped" two of "cup, chopped". Their own words are
 * kept even where a product label would be read as just "serving"; blank (or only a weight)
 * is 1 serving.
 */
export function typedServing(
  text: string,
  grams: number,
): { portion: Portion; quantity: number } {
  let clean = withoutNotes(text).replace(/^(a|an|one)\s+/i, '1 ');
  // Mixed numbers first ("1 1/2 cups", "1½ cups"), then a fraction on its own.
  clean = clean.replace(MIXED, (whole, w: string, a: string, b: string) =>
    Number(b) > 0 ? String(round2(Number(w) + Number(a) / Number(b))) : whole,
  );
  clean = clean.replace(/^(\d+)\s*([½¼¾])/, (_, w: string, c: string) =>
    String(Number(w) + Number(VULGAR[c])),
  );
  clean = clean.replace(/^[½¼¾]/, (c) => VULGAR[c]);
  clean = clean.replace(FRACTION, (whole, a: string, b: string) =>
    Number(b) > 0 ? String(round2(Number(a) / Number(b))) : whole,
  );
  const counted = /^\d/.test(clean) ? clean : `1 ${clean}`;
  const m = /^(\d+(?:[.,]\d+)?)\s*(.*)$/.exec(counted);
  const count = m ? parseFloat(m[1].replace(',', '.')) : NaN;
  const noun = m ? m[2].trim() : '';
  const one = { portion: { label: 'serving', grams }, quantity: 1 };
  if (!noun || !(count > 0)) return one;
  if (COUNTED_WORDS.test(counted)) {
    const portion = servingPortion(counted, grams);
    return { portion, quantity: round2(grams / portion.grams) };
  }
  // Words a label reader wouldn't take ("cups, chopped"): kept as typed.
  return {
    portion: {
      label: count === 1 ? noun.toLowerCase() : singularLabel(noun.toLowerCase()),
      grams: round1(grams / count),
    },
    quantity: count,
  };
}
