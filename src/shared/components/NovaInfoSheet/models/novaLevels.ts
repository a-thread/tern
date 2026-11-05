import type { Tier } from '@/domain/food/models/foodEntry';

export type NovaLevel = {
  tier: Tier;
  name: string;
  /** What puts a food at this level, in a sentence. */
  body: string;
  /** Familiar foods at this level, to make picking easier. */
  examples: string;
  /** The food-type choice this level is logged as: Whole covers levels 1 and 2. */
  choice: string;
};

/** The four NOVA processing levels, as explained wherever a food's type is shown or picked. */
export class NovaLevels {
  static readonly ALL: readonly NovaLevel[] = [
    {
      tier: 1,
      name: 'Unprocessed or minimally processed',
      body: 'Foods as they come, or only washed, cut, frozen, dried, pasteurized or cooked.',
      examples:
        'Fresh or frozen fruit and vegetables, eggs, plain meat and fish, milk, plain yogurt, rice, oats, dried beans, plain nuts, coffee and tea.',
      choice: 'Whole',
    },
    {
      tier: 2,
      name: 'Culinary ingredients',
      body: 'Things pressed, milled or refined from whole foods, used to cook with rather than eaten alone.',
      examples: 'Olive oil, butter, sugar, honey, maple syrup, salt and flour.',
      choice: 'Whole',
    },
    {
      tier: 3,
      name: 'Processed',
      body: 'Whole foods with salt, sugar or oil added, or canned, cured, fermented or baked in simple ways.',
      examples:
        'Fresh-baked bread, cheese, canned beans and vegetables, tinned tuna, smoked salmon, ham, salted nuts and wine.',
      choice: 'Processed',
    },
    {
      tier: 4,
      name: 'Ultra-processed',
      body: 'Industrial products, usually with ingredients you would not cook with at home, like emulsifiers, flavorings or sweeteners.',
      examples:
        'Soft drinks, packaged snacks and sweets, sweetened cereals, instant noodles, nuggets, hot dogs, flavored yogurt and most packaged bread.',
      choice: 'Ultra-processed',
    },
  ];
}
