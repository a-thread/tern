import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import {
  SavedMealsProvider,
  useSavedMeals,
} from '@/domain/saved-meals/SavedMealsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import { createMemoryTernaryRepository } from '@/domain/ternary/ternary.repository';
import { sampleTernary } from '@/domain/ternary/ternary.mock';
import type { Dish } from '@/domain/ternary/models/ternary';
import RecipeScreen from './RecipeScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const soup: Dish = {
  id: 'd9',
  fromName: 'Maya',
  fromId: 'maya',
  stop: '1-iceland',
  name: 'Lentil soup',
  foods: ['Red lentils', 'Coconut milk'],
  items: [
    {
      name: 'Red lentils',
      servings: 2,
      servingLabel: '1 cup',
      calories: 680,
      protein: 50,
      carbs: 110,
      fat: 2,
      tier: 1,
    },
    {
      name: 'Coconut milk',
      servings: 1,
      servingLabel: '1 can (400 ml)',
      calories: 445,
      protein: 4,
      carbs: 6,
      fat: 48,
      tier: 3,
    },
  ],
  servings: 4,
  yours: false,
};

let meals: ReturnType<typeof useSavedMeals>['meals'] = [];
function MealsProbe() {
  meals = useSavedMeals().meals;
  return null;
}

function open() {
  const backend = createMemoryBackend();
  const ternary = { ...sampleTernary('2026-11-28'), dishes: [soup] };
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <SavedMealsProvider repo={backend.savedMeals}>
              <TernaryProvider repo={createMemoryTernaryRepository(ternary)}>
                <RecipeScreen
                  route={{ key: 'r', name: 'Recipe', params: { id: 'd9' } }}
                  navigation={{} as never}
                />
                <MealsProbe />
              </TernaryProvider>
            </SavedMealsProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('a shared recipe', () => {
  it('shows its amounts and servings, never its nutrition', async () => {
    open();
    expect(await screen.findByText('2 × 1 cup')).toBeTruthy();
    expect(screen.getByText('1 can (400 ml)')).toBeTruthy();
    expect(screen.getByText('What’s in it · makes 4')).toBeTruthy();
    expect(screen.queryByText(/calorie|kcal|680|445/i)).toBeNull();
  });

  it('saves to your own meals, ready to log', async () => {
    open();
    fireEvent.press(await screen.findByText('Save to my meals'));
    const saved = meals.find((m) => m.name === 'Lentil soup');
    expect(saved?.servings).toBe(4);
    expect(saved?.items.map((i) => i.name)).toEqual([
      'Red lentils',
      'Coconut milk',
    ]);
    expect(screen.getByText('Saved to your meals')).toBeTruthy();
  });
});
