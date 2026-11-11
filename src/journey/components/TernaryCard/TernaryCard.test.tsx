import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { initialSettings } from '@/domain/settings/models/appSettings';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import {
  createMemoryTernaryRepository,
  sampleTernary,
} from '@/domain/ternary/ternary.repository';
import { TernaryCard } from './TernaryCard';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

async function open(hideTernary: boolean) {
  const backend = createMemoryBackend();
  await backend.settings.save({ ...initialSettings, hideTernary });
  render(
    <SettingsProvider repo={backend.settings}>
      <WaypointsProvider repo={backend.waypoints}>
        <TernaryProvider
          repo={createMemoryTernaryRepository(sampleTernary('2026-11-10'))}
        >
          <TernaryCard />
        </TernaryProvider>
      </WaypointsProvider>
    </SettingsProvider>,
  );
}

describe('TernaryCard', () => {
  it('opens the ternary from Journey', async () => {
    await open(false);
    fireEvent.press(await screen.findByText('Sunday Walkers'));
    expect(mockNavigate).toHaveBeenCalledWith('Ternary');
  });

  it('keeps a way back while the ternary is hidden', async () => {
    await open(true);
    expect(screen.queryByText('Sunday Walkers')).toBeNull();
    fireEvent.press(await screen.findByText('Your ternary is hidden'));
    expect(await screen.findByText('Sunday Walkers')).toBeTruthy();
  });
});
