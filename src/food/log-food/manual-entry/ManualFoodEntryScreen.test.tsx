import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Meal } from '@/domain/food/models/foodEntry';
import { Units } from '@shared/utils/units';
import ManualFoodEntryScreen from './ManualFoodEntryScreen';

const mockAdd = jest.fn();
jest.mock('@/domain/food/FoodContext', () => ({
  useFood: () => ({ addFoodEntry: mockAdd }),
}));
const mockSaveRecipe = jest.fn();
jest.mock('@/domain/saved-meals/SavedMealsContext', () => ({
  useSavedMeals: () => ({
    addDraftItem: jest.fn(),
    saveRecipe: mockSaveRecipe,
  }),
}));
let mockUnits = 'imperial';
jest.mock('@/domain/settings/hooks/useUnits', () => ({
  useUnits: () => ({ units: mockUnits }),
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

beforeEach(() => {
  mockAdd.mockClear();
  mockSaveRecipe.mockReset();
  mockSaveRecipe.mockReturnValue({ ok: true });
  mockUnits = Units.Imperial;
});

const type = (ui: ReturnType<typeof open>, label: string, text: string) =>
  fireEvent.changeText(ui.getByLabelText(label), text);

describe('serving size', () => {
  it('starts empty, shows its units up front, and saves "1 serving" when left blank', () => {
    mockDisplay = display({});
    const ui = open();
    expect(ui.getByLabelText('Serving size').props.value).toBe('');
    expect(ui.getByText('oz')).toBeTruthy();
    expect(ui.getByText('serving')).toBeTruthy();
    fireEvent.press(ui.getByText('Save and log'));
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ servingLabel: '1 serving' }),
    );
  });
});

describe('food type', () => {
  it('chooses no type for you, and asks for one before saving when types are tracked', () => {
    mockDisplay = display({ showTiers: true });
    const ui = open();
    expect(ui.getByText('Choose a food type to save')).toBeTruthy();
    fireEvent.press(ui.getByText('Choose a food type to save'));
    expect(mockAdd).not.toHaveBeenCalled();
    fireEvent.press(ui.getByText('Processed'));
    fireEvent.press(ui.getByText('Save and log'));
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ tier: 3 }));
  });

  it('never asks when food types are not tracked', () => {
    mockDisplay = display({ showTiers: false });
    const ui = open();
    fireEvent.press(ui.getByText('Save and log'));
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ tier: 1 }));
  });
});

describe('a homemade batch', () => {
  beforeEach(() => {
    mockDisplay = display({});
  });

  it('shares the batch totals out per serving and saves a recipe', () => {
    const ui = open();
    type(ui, 'How many servings it makes', '8');
    type(ui, 'Calories', '2400');
    type(ui, 'Protein', '160');
    expect(ui.getByText('Nutrition for the whole batch (optional)')).toBeTruthy();
    expect(ui.getByText(/One serving: 300 cal · 20g protein/)).toBeTruthy();
    fireEvent.press(ui.getByText('Save recipe and log 1 serving'));
    expect(mockSaveRecipe).toHaveBeenCalledWith(
      'Chili',
      expect.objectContaining({ calories: 2400, servingLabel: 'whole batch' }),
      8,
    );
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Chili',
        servings: 1,
        calories: 300,
        protein: 20,
      }),
    );
  });

  it('logs just the serving when saving as a recipe is turned off', () => {
    const ui = open();
    type(ui, 'How many servings it makes', '4');
    fireEvent.press(ui.getByLabelText('Save as a recipe'));
    fireEvent.press(ui.getByText('Log 1 serving'));
    expect(mockSaveRecipe).not.toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
  });

  it('shows a name clash next to the name and logs nothing', () => {
    mockSaveRecipe.mockReturnValue({
      ok: false,
      error: 'You already have a meal called “Chili”.',
    });
    const ui = open();
    type(ui, 'How many servings it makes', '8');
    fireEvent.press(ui.getByText('Save recipe and log 1 serving'));
    expect(ui.getByText('You already have a meal called “Chili”.')).toBeTruthy();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('logs a weighed serving as an amount it can be changed in later', () => {
    const ui = open();
    type(ui, 'Serving size', '1 bowl');
    type(ui, 'What one serving weighs, in ounces', '12');
    type(ui, 'Calories', '450');
    fireEvent.press(ui.getByText('Save and log'));
    const entry = mockAdd.mock.calls[0][0];
    expect(entry.servingLabel).toBe('1 bowl (340.2 g)');
    expect(entry.calories).toBe(450);
    expect(entry.measure).toMatchObject({ unit: 'bowl', quantity: 1 });
  });

  it('says what is wrong with a number, beside it', () => {
    const ui = open();
    type(ui, 'How many servings it makes', '500');
    expect(ui.getByText('Enter a whole number from 1 to 100.')).toBeTruthy();
  });
});

describe('ManualFoodEntryScreen', () => {
  it('still asks for calories when they are tracked but counts are hidden', () => {
    mockDisplay = display({ showCalories: false });
    const ui = open();
    expect(ui.getByText('Calories')).toBeTruthy();
  });

  it('shows grams beside protein, carbs and fat before anything is typed', () => {
    mockDisplay = display({});
    const ui = open();
    expect(ui.getAllByText('g')).toHaveLength(3);
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
    expect(ui.queryByText(/Homemade or missing/)).toBeNull();
    // No weight to ask for without numbers; a recipe can still be saved.
    expect(ui.queryByText('Serving weighs')).toBeNull();
    expect(
      ui.getByLabelText('How many servings it makes').props.placeholder,
    ).toBe('optional');
    fireEvent.press(ui.getByText('Save and log'));
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Chili', meal: Meal.Lunch }),
    );
  });
});
