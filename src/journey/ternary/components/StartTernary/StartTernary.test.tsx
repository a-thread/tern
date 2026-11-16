import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { initialSettings } from '@/domain/settings/models/appSettings';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import {
  createMemoryTernaryRepository,
  type TernaryRepository,
} from '@/domain/ternary/ternary.repository';
import { RouteId } from '@/domain/waypoints/models/routes';
import { StartTernary } from './StartTernary';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open(repo: TernaryRepository) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider
          repo={backend.settings}
          defaults={{ ...initialSettings, firstName: 'Rudy' }}
        >
          <WaypointsProvider repo={backend.waypoints}>
            <TernaryProvider repo={repo}>
              <StartTernary />
            </TernaryProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('StartTernary', () => {
  it('opens on joining, and only shows the way you pick', async () => {
    open(createMemoryTernaryRepository());
    expect(await screen.findByLabelText('Invite code')).toBeTruthy();
    expect(screen.queryByLabelText('Ternary name')).toBeNull();

    fireEvent.press(screen.getByText('Start a ternary'));
    expect(screen.getByLabelText('Ternary name')).toBeTruthy();
    expect(screen.queryByLabelText('Invite code')).toBeNull();
  });

  it('says what a code needs, next to it, instead of fading the button', async () => {
    open(createMemoryTernaryRepository());
    fireEvent.changeText(await screen.findByLabelText('Invite code'), 'KTW');
    fireEvent.press(screen.getByText('Join'));
    expect(
      screen.getByText('Invite codes are 6 letters and numbers.'),
    ).toBeTruthy();
  });

  it('asks for a name before starting, then starts as the bird you chose', async () => {
    const repo = createMemoryTernaryRepository();
    const create = jest.spyOn(repo, 'create');
    open(repo);
    fireEvent.press(await screen.findByText('Start a ternary'));
    fireEvent.press(screen.getByText('Start the ternary'));
    expect(screen.getByText('Give your ternary a name.')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Lime tern'));
    fireEvent.changeText(screen.getByLabelText('Ternary name'), 'Silly Goose');
    expect(screen.queryByText('Give your ternary a name.')).toBeNull();
    fireEvent.press(screen.getByText('Start the ternary'));
    expect(create).toHaveBeenCalledWith(
      'Silly Goose',
      'Rudy',
      RouteId.Greenland,
      6,
    );
  });
});
