import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { SettingsProvider } from '@settings/SettingsContext';
import { WaypointsProvider } from '@journey/WaypointsContext';
import WaypointsScreen from './WaypointsScreen';
import MilestoneScreen from './MilestoneScreen';

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
          <WaypointsProvider repo={backend.waypoints}>{screen}</WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

// Only route.params is read; the screens navigate through useNavigation.
const screenProps = (params: object) => ({ navigation: {}, route: { key: 'k', name: 'x', params } }) as unknown;
const waypointsProps = screenProps({ streak: 9 }) as React.ComponentProps<typeof WaypointsScreen>;
const milestoneProps = screenProps({ waypoints: 1000 }) as React.ComponentProps<typeof MilestoneScreen>;

describe('waypoints card', () => {
  it('shows the total, the streak, the next stop, and the way to Journey', async () => {
    const ui = open(<WaypointsScreen {...waypointsProps} />);
    await waitFor(() => expect(ui.getByText('Next stop')).toBeTruthy());
    expect(ui.getByText('Waypoints so far')).toBeTruthy();
    expect(ui.getByText('☀ 9-day streak')).toBeTruthy();
    expect(ui.getByText(/to go$/)).toBeTruthy();
    expect(ui.getByText('See your journey ›')).toBeTruthy();
    expect(ui.getByText('Earned for showing up, never for weight or calories.')).toBeTruthy();
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
