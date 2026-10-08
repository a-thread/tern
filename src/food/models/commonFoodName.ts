/**
 * Turns a USDA description into a short name and a detail line:
 * "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
 *   → { name: "Chicken breast", detail: "meat only, cooked, roasted" }.
 * Used when the common-foods list is built, not at search time.
 */

// Segments that describe the animal or the data set, not the food you'd log.
const NOISE =
  /^(broilers or fryers|all classes|all grades|separable lean( and fat)?|ns as to .*|nfs|includes .*|commercial|unprepared|year round average)$/i;

// A cut or part that belongs in the name: "Chicken" + "breast" reads as "Chicken breast".
const PARTS =
  /^(breast|thigh|wing|drumstick|leg|loin|tenderloin|rib|ribs|chop|chops|steak|fillet|juice|kernels?|seeds?|leaves|florets|sauce|butter|flour|bran|germ)$/i;

// Parts that read before the head: "Beef, ground" is "Ground beef".
const PARTS_BEFORE = /^(ground)$/i;

// Parts that only belong with one head: an egg's white is "Egg white", but rice's white is a color.
const PARTS_FOR: Record<string, RegExp> = { egg: /^(whites?|yolks?)$/i, eggs: /^(whites?|yolks?)$/i };

// A general head whose next segment names the actual food: "Fish, salmon" is "Salmon",
// "Cheese, cheddar" is "Cheddar cheese".
const KIND_OF: Record<string, (kind: string) => string> = {
  fish: (k) => k,
  nuts: (k) => k,
  cheese: (k) => `${k} cheese`,
  yogurt: (k) => `${k} yogurt`,
  beans: (k) => `${k} beans`,
  bread: (k) => `${k} bread`,
  tea: (k) => `${k} tea`,
};

// A preparation or state, not a kind: "Cheese, nfs" or "Fish, raw" keep their head.
const PREP =
  /^(raw|cooked|hot|iced|plain|whole|regular|fresh|frozen|dried|canned|baked|boiled|roasted|grilled|steamed|fried|smoked|lowfat|low fat|nonfat|fat free|reduced fat|reduced sodium|unsalted|salted|sweetened|unsweetened|flavored|fruit|liquid|soy|with .*|from .*|made .*|as ingredient)$/i;

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function splitUsdaName(description: string): { name: string; detail?: string } {
  // Brackets hold asides ("(garbanzo beans, bengal gram)") whose commas aren't segments.
  const segments = description
    .replace(/\([^)]*\)/g, ' ')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !NOISE.test(s));
  if (!segments.length) return { name: description.trim() };

  const [head, ...rest] = segments;
  let name = head;
  let others = rest;
  const kindOf = KIND_OF[head.toLowerCase()];
  const next = rest[0];
  if (kindOf && next && !PREP.test(next) && next.split(/\s+/).length <= 2 && !/\b(or|and)\b/i.test(next)) {
    name = kindOf(next);
    others = rest.slice(1);
  } else if (!/\s/.test(head)) {
    // A one-word head ("Chicken", "Apples") takes the first cut or part that follows it.
    const own = PARTS_FOR[head.toLowerCase()];
    const i = rest.findIndex((s) => PARTS.test(s) || PARTS_BEFORE.test(s) || own?.test(s));
    if (i >= 0) {
      name = PARTS_BEFORE.test(rest[i]) ? `${rest[i]} ${head}` : `${head} ${rest[i]}`;
      others = rest.filter((_, j) => j !== i);
    }
  }
  const detail = others.join(', ').toLowerCase();
  return detail ? { name: sentence(name), detail } : { name: sentence(name) };
}

// Details that mean a variant of the food rather than the food itself.
const VARIANT =
  /\b(creamed|deviled|benedict|canned|candied|honey|salted|seasoned|flavored|sweetened|fried|frozen|dried|stuffed|with|from|fat added|mix|instant|cocktail|imitation|substitute|nectar|total can contents|ns as to|roll|deli|loaf|luncheon|patty|patties|nuggets?|strips|tenders|coated|ready-to-heat)\b/i;
const PLAIN = /\b(raw|plain|whole|cooked|brewed|baked|boiled|roasted|fresh|regular)\b/i;

/**
 * How plain a food's detail is; lower is plainer. Picks "Egg, whole, raw" over
 * "Egg, creamed" as the food a bare "Egg" means.
 */
export function plainness(detail = ''): number {
  const words = detail.split(/[\s,]+/).filter(Boolean).length;
  return words + (VARIANT.test(detail) ? 10 : 0) - (PLAIN.test(detail) ? 2 : 0);
}

// Portion wording that adds nothing: "(no ice)", ", NFS", "any size".
const PORTION_NOISE = /\s*\((no ice|with ice)\)|,\s*nfs\b|,?\s*any size\b/gi;

/** A portion label without dataset noise: "fl oz (no ice)" → "fl oz", "apple, any size" → "apple". */
export const cleanPortionLabel = (label: string) => {
  const l = label.replace(PORTION_NOISE, '').trim();
  // RACC is USDA's "reference amount customarily consumed": a serving.
  return /^racc$/i.test(l) ? 'serving' : l.charAt(0).toLowerCase() + l.slice(1);
};

// A weight or volume measure says less than a household one ("cup", "medium banana").
const WEIGHT_MEASURE = /^(fl oz|oz|ounce|g|gram|lb|pound)s?\b/i;

/** Household portions first; ounce and gram measures after. Order is otherwise kept. */
export function portionOrder(labels: string[]): number[] {
  return labels
    .map((l, i) => ({ i, weight: WEIGHT_MEASURE.test(l) ? 1 : 0 }))
    .sort((a, b) => a.weight - b.weight || a.i - b.i)
    .map((x) => x.i);
}
