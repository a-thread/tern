import { Meal } from '../../food/models/foodEntry';
import {
  checkInFor,
  cleanNote,
  MealCheckInNote,
  describeMealCheckIn,
  isValidMealScore,
  MealCheckInMetric,
  mealScoreWord,
} from './mealCheckIn';

describe('meal check-in scores', () => {
  it('accepts whole scores from 1 to 5 only', () => {
    expect([1, 3, 5].every(isValidMealScore)).toBe(true);
    expect([0, 6, 2.5, NaN].some(isValidMealScore)).toBe(false);
  });

  it('has a word for each score, kept on the scale', () => {
    expect(mealScoreWord(MealCheckInMetric.Fullness, 1)).toBe('Still hungry');
    expect(mealScoreWord(MealCheckInMetric.Fullness, 3)).toBe('Satisfied');
    expect(mealScoreWord(MealCheckInMetric.Feeling, 5)).toBe('Great');
    expect(mealScoreWord(MealCheckInMetric.Feeling, 9)).toBe('Great');
  });

  it('reads as one line', () => {
    expect(
      describeMealCheckIn({
        day: '2026-10-20',
        meal: Meal.Lunch,
        fullness: 3,
        feeling: 4,
      }),
    ).toBe('Satisfied · feeling good');
  });

  it('finds the check-in for a meal on a day', () => {
    const lunch = {
      day: '2026-10-20',
      meal: Meal.Lunch,
      fullness: 3,
      feeling: 4,
    };
    const entries = [
      lunch,
      { ...lunch, day: '2026-10-19' },
      { ...lunch, meal: Meal.Dinner },
    ];
    expect(checkInFor(entries, '2026-10-20', Meal.Lunch)).toBe(lunch);
    expect(checkInFor(entries, '2026-10-20', Meal.Snack)).toBeUndefined();
  });
});

describe('meal check-in notes', () => {
  it('trims a note, and treats blank space as no note', () => {
    expect(cleanNote('  ate outside  ')).toBe('ate outside');
    expect(cleanNote('   ')).toBeUndefined();
    expect(cleanNote(undefined)).toBeUndefined();
  });

  it('caps a note at its length', () => {
    const long = 'a'.repeat(MealCheckInNote.MAX_LENGTH + 20);
    expect(cleanNote(long)).toHaveLength(MealCheckInNote.MAX_LENGTH);
  });
});
