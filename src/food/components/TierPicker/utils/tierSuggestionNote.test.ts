import { FoodSource } from '@/domain/food/models/foodSource';
import { tierSuggestionNote } from './tierSuggestionNote';

describe('tierSuggestionNote', () => {
  it('credits Open Food Facts for its NOVA level', () => {
    expect(tierSuggestionNote(4, FoodSource.Off)).toBe(
      'Suggested from Open Food Facts processing data (NOVA 4).',
    );
  });

  it('calls a common food level a suggestion for this kind of food', () => {
    expect(tierSuggestionNote(1, FoodSource.Common)).toBe(
      'Suggested for this kind of food (NOVA 1).',
    );
  });

  it('says a food from history keeps the last choice', () => {
    expect(tierSuggestionNote(3, undefined)).toBe(
      'The type you chose last time.',
    );
  });

  it('says when a searched food has no processing data', () => {
    expect(tierSuggestionNote(null, FoodSource.Off)).toBe(
      'No processing data for this food.',
    );
  });

  it('shows nothing for a food you are making or editing yourself', () => {
    expect(tierSuggestionNote(null, undefined)).toBeNull();
  });
});
