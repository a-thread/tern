import type { Tier } from '../../food/models/foodEntry';

// Build-time NOVA suggestion: clear cases (1–3) only, doubtful ones unset, never 4.

// Signs that a food is more than its plain form, or a mixed dish: no suggestion.
const NOT_PLAIN =
  /\b(fried|breaded|battered|candied|sweetened|frosted|glazed|with added|chips?|cookies?|cakes?|cereal|sausages?|bacon|ham|hot dogs?|frankfurters?|bologna|salami|pepperoni|nuggets?|sodas?|soft drinks?|candy|candies|syrup|sauce|dressing|gravy|soup|pie|pastry|pastries|snack|bars?|instant|mix|prepared from|cocktail|drink|beverage|flavored|imitation|substitute|nfs|pizza|sandwich(es)?|burgers?|burritos?|tacos?|casserole|lasagna|stew|salad)\b/i;

const CULINARY =
  /^(olive oil|vegetable oil|canola oil|coconut oil|oil|butter|ghee|lard|sugar|brown sugar|honey|maple syrup|salt|flour|cornstarch|vinegar)\b/i;

// Processed by name (bread, cheese), or by preparation (canned, smoked).
const PROCESSED_NAME =
  /\b(bread|cheese|tofu|hummus|peanut butter|nut butter)\b/i;
const PROCESSED_PREP = /\b(canned|smoked|cured|pickled)\b/i;

const WHOLE_CATEGORY =
  /\b(fruits?|vegetables?|legumes?|beans|nuts?|seeds?|spices|herbs|poultry|chicken|turkey|beef|pork|lamb|veal|fish|finfish|shellfish|seafood|eggs?)\b/i;

const WHOLE_NAME =
  /^(eggs?|egg whites?|milk|plain yogurt|greek yogurt|yogurt|rice|oats|oatmeal|quinoa|barley|pasta|spaghetti|noodles|potatoe?s?|sweet potatoe?s?|coffee|tea|water)\b/i;

export function suggestTier(
  name: string,
  detail = '',
  category = '',
): Tier | null {
  const text = `${name} ${detail}`;
  if (CULINARY.test(name)) return 2;
  if (NOT_PLAIN.test(text)) return null;
  if (PROCESSED_NAME.test(name) || PROCESSED_PREP.test(text)) return 3;
  if (WHOLE_NAME.test(name)) return 1;
  if (WHOLE_CATEGORY.test(category) || WHOLE_CATEGORY.test(name)) return 1;
  return null;
}
