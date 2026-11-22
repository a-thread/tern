import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
import { TernaryIntro } from './components/TernaryIntro/TernaryIntro';
import StartTernaryScreen from './start/StartTernaryScreen';
import JoinTernaryScreen from './join/JoinTernaryScreen';

const mockNav = { navigate: jest.fn(), popTo: jest.fn(), goBack: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNav,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open(screenEl: React.ReactElement, repo: TernaryRepository) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider
          repo={backend.settings}
          defaults={{ ...initialSettings, firstName: 'Rudy' }}
        >
          <WaypointsProvider repo={backend.waypoints}>
            <TernaryProvider repo={repo}>{screenEl}</TernaryProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => Object.values(mockNav).forEach((f) => f.mockClear()));

describe('Fly with friends', () => {
  it('explains a ternary, then offers starting one or joining one', () => {
    open(<TernaryIntro />, createMemoryTernaryRepository());
    expect(screen.getByText('What’s a ternary?')).toBeTruthy();
    expect(screen.queryByLabelText('Ternary name')).toBeNull();
    fireEvent.press(screen.getByText('Start a ternary'));
    expect(mockNav.navigate).toHaveBeenCalledWith('StartTernary');
    fireEvent.press(screen.getByText('Join with a code'));
    expect(mockNav.navigate).toHaveBeenCalledWith('JoinTernary');
  });
});

describe('Start a ternary', () => {
  it('asks for a name, then starts as the bird you chose and flies you home', async () => {
    const repo = createMemoryTernaryRepository();
    const create = jest.spyOn(repo, 'create');
    open(<StartTernaryScreen />, repo);
    fireEvent.press(screen.getByText('Start the ternary'));
    expect(screen.getByText('Give your ternary a name.')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Ternary name'), 'Silly goose');
    fireEvent.press(screen.getByLabelText('Lime tern'));
    await act(async () => {
      fireEvent.press(screen.getByText('Start the ternary'));
    });
    expect(create).toHaveBeenCalledWith(
      'Silly goose',
      'Rudy',
      RouteId.Greenland,
      6,
    );
    expect(mockNav.popTo).toHaveBeenCalledWith('TernaryHome', {
      arrived: true,
    });
  });
});

describe('Join a ternary', () => {
  it('says what a code needs, and stays put when no ternary has it', async () => {
    open(<JoinTernaryScreen />, createMemoryTernaryRepository());
    fireEvent.changeText(screen.getByLabelText('Invite code'), 'KTW');
    fireEvent.press(screen.getByText('Join'));
    expect(
      screen.getByText('Invite codes are 6 letters and numbers.'),
    ).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Invite code'), 'NOPE00');
    await act(async () => {
      fireEvent.press(screen.getByText('Join'));
    });
    expect(screen.getByText(/No ternary has that code/)).toBeTruthy();
    expect(mockNav.popTo).not.toHaveBeenCalled();
  });

  it('joins with a friend’s code and flies you home', async () => {
    open(<JoinTernaryScreen />, createMemoryTernaryRepository());
    fireEvent.changeText(screen.getByLabelText('Invite code'), 'ktw-4qp');
    await act(async () => {
      fireEvent.press(screen.getByText('Join'));
    });
    expect(mockNav.popTo).toHaveBeenCalledWith('TernaryHome', {
      arrived: true,
    });
  });
});
