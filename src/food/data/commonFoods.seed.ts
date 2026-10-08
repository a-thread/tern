import type { CommonFood } from '@food/models/commonFoods';

/**
 * A small starter set of common foods (per 100 g, rounded USDA figures), for
 * local mode and tests. The full list (~3,000 foods) is built by
 * scripts/buildCommonFoods.ts and synced from the backend.
 */
export const commonFoodsSeed: CommonFood[] = [
  { id: 'egg', name: 'Egg', detail: 'whole, large', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, portions: [{ label: 'large egg', grams: 50 }], rank: 1, tier: 1 },
  { id: 'banana', name: 'Banana', detail: 'raw', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, portions: [{ label: 'medium banana', grams: 118 }], rank: 2, tier: 1 },
  { id: 'apple', name: 'Apple', detail: 'raw, with skin', kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, portions: [{ label: 'medium apple', grams: 182 }], rank: 3, tier: 1 },
  { id: 'chicken-breast', name: 'Chicken breast', detail: 'meat only, roasted', kcal: 165, protein: 31, carbs: 0, fat: 3.6, portions: [{ label: 'half breast', grams: 86 }, { label: 'oz', grams: 28.35 }], rank: 4, tier: 1 },
  { id: 'rice-white', name: 'Rice', detail: 'white, cooked', kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, portions: [{ label: 'cup', grams: 158 }], rank: 5, tier: 1 },
  { id: 'oats', name: 'Oats', detail: 'rolled, dry', aliases: ['oatmeal', 'porridge'], kcal: 379, protein: 13.2, carbs: 67.7, fat: 6.5, portions: [{ label: 'cup', grams: 81 }], rank: 6, tier: 1 },
  { id: 'milk-whole', name: 'Milk', detail: 'whole', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, portions: [{ label: 'cup', grams: 244 }], rank: 7, tier: 1 },
  { id: 'greek-yogurt', name: 'Greek yogurt', detail: 'plain, nonfat', kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4, portions: [{ label: 'container', grams: 170 }], rank: 8, tier: 1 },
  { id: 'bread-whole-wheat', name: 'Bread', detail: 'whole wheat', kcal: 252, protein: 12.4, carbs: 42.7, fat: 3.5, portions: [{ label: 'slice', grams: 32 }], rank: 9, tier: 3 },
  { id: 'orange-juice', name: 'Orange juice', detail: '100% juice', aliases: ['oj'], kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2, portions: [{ label: 'cup', grams: 248 }], rank: 10, tier: 1 },
  { id: 'coffee', name: 'Coffee', detail: 'brewed', kcal: 1, protein: 0.1, carbs: 0, fat: 0, portions: [{ label: 'cup', grams: 237 }], rank: 11, tier: 1 },
  { id: 'peanut-butter', name: 'Peanut butter', detail: 'smooth', aliases: ['pb'], kcal: 588, protein: 25, carbs: 20, fat: 50, portions: [{ label: 'tbsp', grams: 16 }], rank: 12, tier: 3 },
  { id: 'avocado', name: 'Avocado', detail: 'raw', kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, portions: [{ label: 'avocado', grams: 201 }], rank: 13, tier: 1 },
  { id: 'broccoli', name: 'Broccoli', detail: 'cooked', kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4, portions: [{ label: 'cup', grams: 156 }], rank: 14, tier: 1 },
  { id: 'salmon', name: 'Salmon', detail: 'Atlantic, cooked', kcal: 206, protein: 22, carbs: 0, fat: 12, portions: [{ label: 'fillet', grams: 154 }], rank: 15, tier: 1 },
  { id: 'olive-oil', name: 'Olive oil', kcal: 884, protein: 0, carbs: 0, fat: 100, portions: [{ label: 'tbsp', grams: 13.5 }], rank: 16, tier: 2 },
  { id: 'butter', name: 'Butter', detail: 'salted', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81.1, portions: [{ label: 'tbsp', grams: 14.2 }], rank: 17, tier: 2 },
  { id: 'cheddar', name: 'Cheddar cheese', kcal: 403, protein: 24.9, carbs: 1.3, fat: 33.1, portions: [{ label: 'slice', grams: 28 }], rank: 18, tier: 3 },
  { id: 'pasta', name: 'Pasta', detail: 'cooked', kcal: 158, protein: 5.8, carbs: 30.9, fat: 0.9, portions: [{ label: 'cup', grams: 140 }], rank: 19, tier: 1 },
  { id: 'potato', name: 'Potato', detail: 'baked, with skin', kcal: 93, protein: 2.5, carbs: 21.2, fat: 0.1, portions: [{ label: 'medium potato', grams: 173 }], rank: 20, tier: 1 },
  { id: 'strawberries', name: 'Strawberries', detail: 'raw', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, portions: [{ label: 'cup', grams: 152 }], rank: 21, tier: 1 },
  { id: 'blueberries', name: 'Blueberries', detail: 'raw', kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, portions: [{ label: 'cup', grams: 148 }], rank: 22, tier: 1 },
  { id: 'almonds', name: 'Almonds', kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, portions: [{ label: 'oz', grams: 28 }], rank: 23, tier: 1 },
  { id: 'black-beans', name: 'Black beans', detail: 'cooked', kcal: 132, protein: 8.9, carbs: 23.7, fat: 0.5, portions: [{ label: 'cup', grams: 172 }], rank: 24, tier: 1 },
  { id: 'spinach', name: 'Spinach', detail: 'raw', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, portions: [{ label: 'cup', grams: 30 }], rank: 25, tier: 1 },
  { id: 'chicken-thigh', name: 'Chicken thigh', detail: 'meat only, roasted', kcal: 209, protein: 26, carbs: 0, fat: 10.9, portions: [{ label: 'thigh', grams: 52 }], rank: 26, tier: 1 },
  { id: 'honey', name: 'Honey', kcal: 304, protein: 0.3, carbs: 82.4, fat: 0, portions: [{ label: 'tbsp', grams: 21 }], rank: 27, tier: 2 },
  { id: 'hummus', name: 'Hummus', kcal: 166, protein: 7.9, carbs: 14.3, fat: 9.6, portions: [{ label: 'tbsp', grams: 15 }], rank: 28, tier: 3 },
  { id: 'egg-noodles', name: 'Egg noodles', detail: 'cooked', kcal: 138, protein: 4.5, carbs: 25.2, fat: 2.1, portions: [{ label: 'cup', grams: 160 }], rank: 400, tier: null },
  { id: 'egg-white', name: 'Egg white', detail: 'raw', kcal: 52, protein: 10.9, carbs: 0.7, fat: 0.2, portions: [{ label: 'large egg white', grams: 33 }], rank: 120, tier: 1 },
];
