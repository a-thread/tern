import { Units } from '@shared/utils/units';
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
};

describe('resultSubline', () => {
  it('names the first size and its calories', () => {
    expect(
      resultSubline(
        { ...oatmeal, portions: [{ label: 'packet', grams: 35 }] },
        FoodSource.Off,
        true,
        Units.Imperial,
      ),
    ).toBe('Packaged · Key Food · 1 packet · 130 cal');
  });

  it('without a size, gives calories per ounce on Imperial and per 100 g on Metric', () => {
    expect(resultSubline(oatmeal, undefined, true, Units.Imperial)).toBe(
      'Key Food · 105 cal / oz',
    );
    expect(resultSubline(oatmeal, undefined, false, Units.Imperial)).toBe(
      'Key Food · per oz',
    );
    expect(resultSubline(oatmeal, undefined, true, Units.Metric)).toBe(
      'Key Food · 371 cal / 100 g',
    );
  });
});

describe('resultSubline while sizes load', () => {
  it('shows no amount until the sizes arrive', () => {
    expect(
      resultSubline(
        { ...oatmeal, sizesLoading: true },
        FoodSource.Off,
        true,
        Units.Imperial,
      ),
    ).toBe('Packaged · Key Food');
  });
});
