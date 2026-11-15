import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import {
  createMemoryTernaryRepository,
  sampleTernary,
} from '@/domain/ternary/ternary.repository';
import PostcardScreen from './PostcardScreen';
import PostcardsScreen from '../PostcardsScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// The sample ternary has one postcard, from Maya at the North Atlantic stopover.
const ternary = sampleTernary('2026-11-15');
const card = ternary.postcards[0];

function open(children: React.ReactNode) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <TernaryProvider repo={createMemoryTernaryRepository(ternary)}>
              {children}
            </TernaryProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

const postcard = (id: string) => (
  <PostcardScreen
    route={{ key: 'p', name: 'Postcard', params: { id } }}
    navigation={{ goBack: mockGoBack } as never}
  />
);

beforeEach(() => {
  mockNavigate.mockClear();
  mockGoBack.mockClear();
});

describe('postcards', () => {
  it('opens a postcard from the list', async () => {
    open(<PostcardsScreen />);
    await screen.findByText('Received');
    fireEvent.press(await screen.findByLabelText(/^Postcard from Maya/));
    expect(mockNavigate).toHaveBeenCalledWith('Postcard', { id: card.id });
  });

  it('shows who sent it, the place and its facts, and no date', async () => {
    open(postcard(card.id));
    expect(await screen.findByText('From Maya')).toBeTruthy();
    expect(
      screen.getByText('Greetings from The North Atlantic stopover'),
    ).toBeTruthy();
    expect(screen.getByText('About this stop')).toBeTruthy();
    expect(screen.queryByText(/reached|\d{4}-\d{2}-\d{2}/i)).toBeNull();
  });

  it('closes itself when the postcard is gone', async () => {
    open(postcard('no-such-postcard'));
    await screen.findByLabelText(/./).catch(() => null);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
