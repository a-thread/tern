import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import { createMemoryTernaryRepository } from '@/domain/ternary/ternary.repository';
import { sampleTernary } from '@/domain/ternary/ternary.mock';
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

  it('opens on the picture side: the place and who sent it, and no date', async () => {
    open(postcard(card.id));
    expect(await screen.findByText('From Maya')).toBeTruthy();
    expect(screen.getByText('Greetings from')).toBeTruthy();
    expect(screen.getByText('The North Atlantic stopover')).toBeTruthy();
    expect(screen.getByText('Tap the card to turn it over')).toBeTruthy();
    expect(screen.queryByText(/reached|\d{4}-\d{2}-\d{2}/i)).toBeNull();
  });

  it('turns over to the message, signed by the sender and addressed to the ternary', async () => {
    open(postcard(card.id));
    fireEvent.press(
      await screen.findByLabelText(/^Postcard from Maya: greetings/),
    );
    expect(await screen.findByText('– Maya')).toBeTruthy();
    expect(screen.getByText(`To: ${ternary.name}`)).toBeTruthy();
    expect(screen.getByText('Tap to see the picture side')).toBeTruthy();
    expect(
      screen.getByLabelText(/^Postcard from Maya, message side/),
    ).toBeTruthy();
  });

  it('closes itself when the postcard is gone', async () => {
    open(postcard('no-such-postcard'));
    await screen.findByLabelText(/./).catch(() => null);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
