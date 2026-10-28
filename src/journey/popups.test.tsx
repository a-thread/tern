import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '../BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { SettingsProvider } from '../domain/settings/SettingsContext';
import { WaypointsProvider } from '../domain/waypoints/WaypointsContext';
import WaypointsScreen from './waypoints/WaypointsScreen';
import MilestoneScreen from './milestone/MilestoneScreen';
import DestinationScreen from './destination/DestinationScreen';
import StreakScreen from '../today/streak/StreakScreen';

// The waypoints card asks whether a goal day can be reached today and what was skipped; the
// streak card, the streak and freezes held.
jest.mock('@/domain/activity/ActivityContext', () => ({
  useActivity: () => ({ goalReachable: true, streak: 12, freezes: 1 }),
}));
jest.mock('@/domain/movement/MovementContext', () => ({
  useMovement: () => ({ enabled: false }),
}));
jest.mock('@/domain/food/FoodContext', () => ({
  useFood: () => ({ skippedMeals: [] }),
}));
jest.mock('@shared/state/ViewedDayContext', () => ({
  useViewedDay: () => ({ isToday: true }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open(screen: React.ReactElement) {
  const backend = createMemoryBackend();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            {screen}
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

// Only route.params is read; the screens navigate through useNavigation.
const screenProps = (params: object) =>
  ({ navigation: {}, route: { key: 'k', name: 'x', params } }) as unknown;
const waypointsProps = screenProps({ streak: 9 }) as React.ComponentProps<
  typeof WaypointsScreen
>;
const milestoneProps = screenProps({ waypoints: 1000 }) as React.ComponentProps<
  typeof MilestoneScreen
>;

describe('waypoints card', () => {
  it('shows the total, the streak, the next stop, and the way to Journey', async () => {
    const ui = open(<WaypointsScreen {...waypointsProps} />);
    await waitFor(() => expect(ui.getByText('Next stop')).toBeTruthy());
    expect(ui.getByText('Waypoints so far')).toBeTruthy();
    expect(ui.getByText('☀ 9-day streak')).toBeTruthy();
    expect(ui.getByText(/to go$/)).toBeTruthy();
    expect(ui.getByText('See your journey ›')).toBeTruthy();
  });
});

describe('milestone card', () => {
  it('names the stop, says something about it, and points to the next', async () => {
    const ui = open(<MilestoneScreen {...milestoneProps} />);
    await waitFor(() => expect(ui.getByText('The Azores')).toBeTruthy());
    expect(ui.getByText('Milestone reached')).toBeTruthy();
    expect(ui.getByText(/a rare patch of land/)).toBeTruthy();
    expect(ui.getByText(/^Cape Verde · /)).toBeTruthy();
  });
});

describe('destination card', () => {
  const destinationProps = screenProps({
    waypoints: 1000,
  }) as React.ComponentProps<typeof DestinationScreen>;

  it('shows a photo with its credit, and facts about the stop', async () => {
    const ui = open(<DestinationScreen {...destinationProps} />);
    await waitFor(() => expect(ui.getByText('The Azores')).toBeTruthy());
    expect(ui.getByLabelText('Photo of The Azores')).toBeTruthy();
    expect(
      ui.getByText('Photo: Jules Verne Times Two · CC BY-SA 4.0'),
    ).toBeTruthy();
    expect(ui.getByText(/nine volcanic islands/)).toBeTruthy();
  });
});

describe('streak card', () => {
  it('shows what is held now and how freezes are earned and capped', async () => {
    const ui = open(<StreakScreen />);
    expect(ui.getByText('☀ 12 days')).toBeTruthy();
    expect(ui.getByText('❄ 1 of 2 freezes held')).toBeTruthy();
    expect(ui.getByText(/every 7 goal days in a row/)).toBeTruthy();
    // Explaining streaks isn't about the journey, so there's no link to it.
    expect(ui.queryByText('See your journey ›')).toBeNull();
  });
});
