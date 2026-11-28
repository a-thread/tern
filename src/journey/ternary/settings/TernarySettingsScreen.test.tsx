import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import { createMemoryTernaryRepository } from '@/domain/ternary/ternary.repository';
import { sampleTernary } from '@/domain/ternary/ternary.mock';
import type { Ternary } from '@/domain/ternary/models/ternary';
import TernarySettingsScreen from './TernarySettingsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function open(ternary: Ternary) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <TernaryProvider repo={createMemoryTernaryRepository(ternary)}>
              <TernarySettingsScreen />
            </TernaryProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('leaving a ternary', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  beforeEach(() => {
    alert.mockClear();
    mockNavigate.mockClear();
  });

  it('says what leaves with you, the fish brought to you included', async () => {
    open(sampleTernary('2026-11-21'));
    fireEvent.press(await screen.findByText('Leave Sunday Walkers'));
    const [title, message] = alert.mock.calls[0];
    expect(title).toBe('Leave Sunday Walkers?');
    expect(message).toMatch(/so do the fish brought to you/);
  });

  it('says leaving deletes it when you are the only one in it', async () => {
    const sample = sampleTernary('2026-11-21');
    open({ ...sample, members: sample.members.filter((m) => m.you) });
    fireEvent.press(await screen.findByText('Leave and delete Sunday Walkers'));
    const [title, message] = alert.mock.calls[0];
    expect(title).toBe('Delete Sunday Walkers?');
    expect(message).toMatch(/leaving deletes it for good/);
  });

  it('takes you back to Journey once you have left', async () => {
    open(sampleTernary('2026-11-21'));
    fireEvent.press(await screen.findByText('Leave Sunday Walkers'));
    const buttons = alert.mock.calls[0][2] as {
      text: string;
      onPress?: () => Promise<void>;
    }[];
    await act(async () => {
      await buttons.find((b) => b.text === 'Leave')!.onPress!();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Tabs', { screen: 'Journey' });
  });

  it('never says it deletes one where someone you blocked is still in it', async () => {
    const sample = sampleTernary('2026-11-21');
    open({
      ...sample,
      members: sample.members.filter((m) => m.you),
      blocked: [{ userId: 'maya', name: 'Maya' }],
    });
    fireEvent.press(await screen.findByText('Leave Sunday Walkers'));
    expect(alert.mock.calls[0][0]).toBe('Leave Sunday Walkers?');
  });
});
