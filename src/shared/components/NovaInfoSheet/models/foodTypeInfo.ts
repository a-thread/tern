import type { TierGroup } from '@/domain/food/models/tierGroups';

export type FoodTypeInfo = {
  /** What puts a food in this type, in a sentence. */
  body: string;
  /** Familiar foods of this type, to make picking easier. */
  examples: string;
};

/** What each food type means, as explained wherever a food's type is shown or picked. */
export class FoodTypeInfos {
  static readonly BY_KEY: Readonly<Record<TierGroup['key'], FoodTypeInfo>> = {
    whole: {
      body: 'Food in its natural state, or simply cooked, frozen or dried. Basic kitchen staples you cook with, like oil, butter, sugar and flour, count as whole too.',
      examples:
        'Fresh or frozen fruit and vegetables, eggs, plain meat and fish, milk, plain yogurt, rice, oats, dried beans, plain nuts, coffee and tea.',
    },
    processed: {
      body: 'Whole foods with salt, sugar or oil added, or canned, cured, fermented or baked in simple ways.',
      examples:
        'Fresh-baked bread, cheese, canned beans and vegetables, tinned tuna, smoked salmon, ham, salted nuts and kimchi.',
    },
    ultra: {
      body: 'Industrial products, usually with ingredients you would not cook with at home, like emulsifiers, flavorings or sweeteners.',
      examples:
        'Soft drinks, packaged snacks and sweets, sweetened cereals, instant noodles, nuggets, hot dogs, flavored yogurt and most packaged bread.',
    },
  };
}
