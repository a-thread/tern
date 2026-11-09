import { FoodSource } from '@/domain/food/models/foodSource';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { resultSubline } from './FoodResultRow';

const oatmeal: SearchResult = {
  id: '0851087000687',
  name: 'Oatmeal',
  brand: 'Key Food',
  servingLabel: '100 g',
  calories: 371,
  protein: 8.6,
  carbs: 77,
  fat: 5.7,
  tier: 4,
  portions: [{ label: 'packet', grams: 35 }],
};

describe('resultSubline', () => {
  it('says where a food is from and its brand, and no amount', () => {
    expect(resultSubline(oatmeal, FoodSource.Off)).toBe('Packaged · Key Food');
    expect(resultSubline({ ...oatmeal, brand: undefined }, undefined)).toBe(
      '',
    );
  });

  it('uses the detail when there is no brand', () => {
    expect(
      resultSubline(
        { ...oatmeal, brand: undefined, detail: 'cooked' },
        FoodSource.Common,
      ),
    ).toBe('Common · cooked');
  });
});
