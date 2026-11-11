import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { initialSettings } from '@/domain/settings/models/appSettings';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { SavedMealsProvider } from '@/domain/saved-meals/SavedMealsContext';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import {
  createMemoryTernaryRepository,
  sampleTernary,
} from '@/domain/ternary/ternary.repository';
import { Milestones } from '@/domain/waypoints/models/milestone';
import TernaryHomeScreen from './TernaryHomeScreen';
import RecipeSwapScreen from './recipe-swap/RecipeSwapScreen';
import RecipeScreen from './recipe-swap/recipe/RecipeScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => true,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// At Iceland, the first stop, so its table is set.
const ternary = { ...sampleTernary('2026-11-10'), total: Milestones.STOPS[0].waypoints };

function open(Screen: React.ComponentType, hideFriendsFood = false) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SubscriptionProvider repo={createMemorySubscriptionRepository()} userId={null}>
          <SettingsProvider
            repo={backend.settings}
            defaults={{ ...initialSettings, hideFriendsFood }}
          >
            <WaypointsProvider repo={backend.waypoints}>
              <SavedMealsProvider repo={backend.savedMeals}>
                <TernaryProvider repo={createMemoryTernaryRepository(ternary)}>
                  <Screen />
                </TernaryProvider>
              </SavedMealsProvider>
            </WaypointsProvider>
          </SettingsProvider>
        </SubscriptionProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('TernaryHomeScreen', () => {
  it('lists only who is flying today, and never a quiet friend', async () => {
    open(TernaryHomeScreen);
    expect(await screen.findByText('Flying today')).toBeTruthy();
    expect(screen.getByText('Resting')).toBeTruthy();
    // Sam is quiet: offered a fish, but not listed as flying, and not as missing.
    expect(screen.getByLabelText('Bring Sam a fish')).toBeTruthy();
    expect(screen.getAllByText('Sam')).toHaveLength(1);
    expect(screen.queryByText(/missing|behind|inactive/i)).toBeNull();
  });

  it('shows a fish waiting', async () => {
    open(TernaryHomeScreen);
    expect(await screen.findByText('Maya brought you a fish')).toBeTruthy();
  });
});

describe('RecipeSwapScreen', () => {
  it('shows what friends shared at this stop, foods only', async () => {
    open(RecipeSwapScreen);
    expect(await screen.findByText('Red lentil soup')).toBeTruthy();
    expect(screen.getByText('Shared at this stop')).toBeTruthy();
    expect(screen.queryByText(/calorie|kcal/i)).toBeNull();
  });

  it("hides friends' recipes when that safeguard is on", async () => {
    open(RecipeSwapScreen, true);
    expect(await screen.findByText('Share one of your saved meals')).toBeTruthy();
    expect(screen.queryByText('Red lentil soup')).toBeNull();
  });
});

describe('RecipeScreen', () => {
  const Recipe = () => (
    <RecipeScreen route={{ key: 'r', name: 'Recipe', params: { id: 'd1' } }} navigation={{} as never} />
  );

  it("lists a friend's recipe's foods, and keeps it to cook", async () => {
    open(Recipe);
    expect(await screen.findByText('Shared by Maya at Iceland')).toBeTruthy();
    expect(screen.getByText('Coconut milk')).toBeTruthy();
    fireEvent.press(screen.getByText('Keep this recipe'));
    expect(await screen.findByText('Kept to cook · remove')).toBeTruthy();
  });

  it('can report a friend’s recipe', async () => {
    open(Recipe);
    expect(await screen.findByText('Report this recipe')).toBeTruthy();
  });
});
