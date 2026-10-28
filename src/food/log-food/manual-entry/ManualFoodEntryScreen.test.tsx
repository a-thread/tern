import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Meal } from '@/domain/food/models/foodEntry';
import ManualFoodEntryScreen from './ManualFoodEntryScreen';

const mockAdd = jest.fn();
jest.mock('@/domain/food/FoodContext', () => ({
  useFood: () => ({ addFoodEntry: mockAdd }),
}));
jest.mock('@/domain/saved-meals/SavedMealsContext', () => ({
  useSavedMeals: () => ({ addDraftItem: jest.fn() }),
}));
let mockDisplay = {};
jest.mock('@/domain/food/hooks/useFoodDisplay', () => ({
  useFoodDisplay: () => mockDisplay,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open() {
  const props = {
    navigation: { goBack: jest.fn(), getParent: () => null },
    route: { params: { meal: Meal.Lunch, name: 'Chili' } },
  } as unknown as React.ComponentProps<typeof ManualFoodEntryScreen>;
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ManualFoodEntryScreen {...props} />
    </SafeAreaProvider>,
  );
}

const display = (over: object) => ({
  showTiers: false,
  showTierNumber: true,
  showCalories: true,
  tracksCalories: true,
  showMacros: true,
  ...over,
});

beforeEach(() => mockAdd.mockClear());

describe('ManualFoodEntryScreen', () => {
  it('still asks for calories when they are tracked but counts are hidden', () => {
    mockDisplay = display({ showCalories: false });
    const ui = open();
    expect(ui.getByText('Calories')).toBeTruthy();
  });

  it('asks only for what is tracked', () => {
    mockDisplay = display({ showMacros: false });
    const ui = open();
    expect(ui.getByText('Calories')).toBeTruthy();
    expect(ui.queryByText('Protein')).toBeNull();
  });

  it('needs only a name when no numbers are tracked', () => {
    mockDisplay = display({
      showCalories: false,
      tracksCalories: false,
      showMacros: false,
    });
    const ui = open();
    expect(ui.queryByText('Nutrition (optional)')).toBeNull();
    expect(ui.getByText(/A name is all it needs/)).toBeTruthy();
    fireEvent.press(ui.getByText('Save and log'));
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Chili', meal: Meal.Lunch }),
    );
  });
});
