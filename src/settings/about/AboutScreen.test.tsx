import React from 'react';
import { AccessibilityInfo, Linking } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import {
  SettingsProvider,
  useSettings,
} from '@/domain/settings/SettingsContext';
import { TrailColor } from '@/domain/settings/models/trailColor';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { AboutLinks } from './models/aboutLinks';
import AboutScreen from './AboutScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const SUPPORTER: SubscriptionStatus = {
  active: true,
  renews: true,
  expiresAt: '2027-11-01T12:00:00.000Z',
  supporter: true,
};
const PLUS: SubscriptionStatus = { ...SUPPORTER, supporter: false };

let trail: TrailColor | undefined;
function TrailProbe() {
  trail = useSettings().settings.trailColor;
  return null;
}

function open(status: SubscriptionStatus) {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SubscriptionProvider
          repo={createMemorySubscriptionRepository(status)}
          userId={null}
        >
          <SettingsProvider repo={backend.settings}>
            <AboutScreen />
            <TrailProbe />
          </SettingsProvider>
        </SubscriptionProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

afterEach(() => jest.restoreAllMocks());

describe('AboutScreen', () => {
  it('says what Tern is for, and never links out to pay', async () => {
    const openURL = jest.spyOn(Linking, 'openURL');
    open(PLUS);
    expect(await screen.findByText('What Tern promises')).toBeTruthy();
    expect(screen.queryByText(/coffee/i)).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
  });

  it('keeps its promise about the scale', async () => {
    open(PLUS);
    expect(
      await screen.findByText(/never for a number on the scale/),
    ).toBeTruthy();
  });

  it('has a letter from Aiden, with the source code and a way to write', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    open(PLUS);
    expect(await screen.findByText('A letter from Aiden')).toBeTruthy();
    expect(screen.getByText(/I made Tern for myself/)).toBeTruthy();
    expect(screen.getByText('– Aiden')).toBeTruthy();

    fireEvent.press(screen.getByRole('link', { name: 'Email Aiden' }));
    expect(openURL).toHaveBeenLastCalledWith(AboutLinks.EMAIL);
    fireEvent.press(
      screen.getByRole('link', { name: 'Source code on GitHub' }),
    );
    expect(openURL).toHaveBeenLastCalledWith(
      'https://github.com/a-thread/tern',
    );
  });

  it('offers the tip jar as fish, and thanks someone who tips', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    open(PLUS);
    expect(await screen.findByText('Bring Tern a fish')).toBeTruthy();
    expect(screen.getByLabelText('Tip $2.99: a sand eel')).toBeTruthy();
    expect(screen.getByLabelText('Tip $9.99: a herring')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Tip $4.99: a capelin'));
    const thanks = 'Thank you for the capelin. It keeps Tern flying.';
    expect(await screen.findByText(thanks)).toBeTruthy();
    expect(announce).toHaveBeenCalledWith(thanks);
  });

  it('thanks someone on Plus, and a Supporter, under the jar', async () => {
    open(PLUS);
    expect(await screen.findByText('You have Tern Plus')).toBeTruthy();
    expect(screen.queryByText('You’re a Supporter')).toBeNull();
    expect(screen.queryByText('Become a Supporter')).toBeNull();
    screen.unmount();

    open(SUPPORTER);
    expect(await screen.findByText('You’re a Supporter')).toBeTruthy();
    expect(
      screen.getByText('Thank you. Choose your trail colour below.'),
    ).toBeTruthy();
    expect(screen.queryByText('You have Tern Plus')).toBeNull();
  });

  it('lets a Supporter choose their trail', async () => {
    open(SUPPORTER);
    fireEvent.press(await screen.findByLabelText('Twilight trail'));
    await waitFor(() => expect(trail).toBe(TrailColor.Twilight));
  });

  it('offers no trail to someone on plain Plus', async () => {
    open(PLUS);
    expect(await screen.findByText('Support Tern')).toBeTruthy();
    expect(screen.queryByLabelText('Twilight trail')).toBeNull();
  });
});
