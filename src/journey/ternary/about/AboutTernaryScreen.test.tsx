import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import { createMemoryTernaryRepository } from '@/domain/ternary/ternary.repository';
import { sampleTernary } from '@/domain/ternary/ternary.mock';
import AboutTernaryScreen from './AboutTernaryScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open(inTernary: boolean) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SettingsProvider repo={backend.settings}>
        <WaypointsProvider repo={backend.waypoints}>
          <TernaryProvider
            repo={createMemoryTernaryRepository(
              inTernary ? sampleTernary('2026-11-16') : null,
            )}
          >
            <AboutTernaryScreen />
          </TernaryProvider>
        </WaypointsProvider>
      </SettingsProvider>
    </SafeAreaProvider>,
  );
}

describe('How does it work?', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('says what you do together, what friends see and what they never see', () => {
    open(false);
    expect(screen.getByText('What you can do together')).toBeTruthy();
    expect(screen.getByText('What friends can see')).toBeTruthy();
    expect(screen.getByText('What friends never see')).toBeTruthy();
    expect(screen.getByText(/everyone gets 25 waypoints!/)).toBeTruthy();
    expect(screen.getByText(/up to 3 fish a day/)).toBeTruthy();
  });

  it('links the settings it names once you are in a ternary', async () => {
    open(true);
    const links = await screen.findAllByRole('link');
    expect(links).toHaveLength(2);
    fireEvent.press(screen.getByText('turn that on'));
    expect(mockNavigate).toHaveBeenCalledWith('TernarySettings');
  });

  it('names them as plain words before you join one', () => {
    open(false);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
