import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '../BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { SettingsProvider } from '../domain/settings/SettingsContext';
import { WaypointsProvider } from '../domain/waypoints/WaypointsContext';
import { JourneyView } from '../domain/settings/models/journeyView';
import JourneyScreen from './JourneyScreen';

const mockNavigate = jest.fn();
jest.mock('@/domain/activity/ActivityContext', () => ({
  useActivity: () => ({ goalReachable: true }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useIsFocused: () => true,
}));
// Replaying the route on focus needs a navigator; the order of the list doesn't.
jest.mock('@shared/hooks/useReplayOnFocus', () => ({
  useReplayOnFocus: () => 0,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open() {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <JourneyScreen />
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  return backend;
}

// The sample total (1,240) has passed Iceland, the stopover and the Azores, and is headed to Cape Verde.
describe('Journey stops', () => {
  it('lists the stop being headed to first, then the ones passed, newest first', async () => {
    open();
    await screen.findByText('Stops');
    const names = screen
      .getAllByText(
        /^(Cape Verde|The Azores|The North Atlantic stopover|Iceland)$/,
      )
      .map((node) => node.props.children);
    // Cape Verde twice: the next-milestone card, then the top of the list.
    expect(names).toEqual([
      'Cape Verde',
      'Cape Verde',
      'The Azores',
      'The North Atlantic stopover',
      'Iceland',
    ]);
  });

  it('opens a passed stop’s card from its row', async () => {
    open();
    await screen.findByText('Iceland');
    fireEvent.press(screen.getByText('Iceland'));
    expect(mockNavigate).toHaveBeenCalledWith('Destination', {
      waypoints: 250,
    });
  });
});

describe('Journey map', () => {
  it('starts on the flat map, heading to the next stop', async () => {
    open();
    expect(
      await screen.findByLabelText(
        'Map of the migration. Heading to Cape Verde',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Flat map').props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('switches to the globe and remembers it', async () => {
    const backend = open();
    await screen.findByLabelText('Globe');
    await act(async () => fireEvent.press(screen.getByLabelText('Globe')));
    expect(
      screen.getByLabelText('Globe').props.accessibilityState,
    ).toMatchObject({ selected: true });
    await waitFor(async () =>
      expect((await backend.settings.load())?.journeyView).toBe(
        JourneyView.Globe,
      ),
    );
  });
});
