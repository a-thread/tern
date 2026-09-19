import type { Tier } from './models';

/**
 * Mock stand-in for an Open Food Facts search response. `tier` is the
 * NOVA-derived suggestion; `null` means the product had no processing
 * data and the picker should prompt for it instead of guessing.
 */
export type SearchResult = {
  id: string;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tier: Tier | null;
};

export const searchResults: SearchResult[] = [
  {
    id: 's1',
    name: 'Rolled oats',
    brand: "Bob's Red Mill",
    servingLabel: '40 g',
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 3,
    tier: 1,
  },
  {
    id: 's2',
    name: 'Oat milk, original',
    brand: 'Oatly',
    servingLabel: '240 ml',
    calories: 120,
    protein: 3,
    carbs: 16,
    fat: 5,
    tier: 3,
  },
  {
    id: 's3',
    name: 'Oatmeal cookie bar',
    brand: 'Quaker',
    servingLabel: '1 bar',
    calories: 190,
    protein: 3,
    carbs: 29,
    fat: 7,
    tier: 4,
  },
  {
    id: 's4',
    name: 'Oat flour, bulk',
    servingLabel: '100 g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    tier: null,
  },
];

export const recentResults: SearchResult[] = [
  {
    id: 'r1',
    name: 'Greek yogurt with berries',
    servingLabel: '1 bowl',
    calories: 210,
    protein: 18,
    carbs: 24,
    fat: 4,
    tier: 1,
  },
  {
    id: 'r2',
    name: 'Chili, homemade',
    servingLabel: '1 bowl',
    calories: 420,
    protein: 30,
    carbs: 26,
    fat: 12,
    tier: 2,
  },
];

export const tierPickerOptions: { tier: Tier; label: string }[] = [
  { tier: 1, label: 'Whole' },
  { tier: 3, label: 'Processed' },
  { tier: 4, label: 'Ultra-proc.' },
];
