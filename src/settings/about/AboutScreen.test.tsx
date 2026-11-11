import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider, useSettings } from '@/domain/settings/SettingsContext';
import { TrailColor } from '@/domain/settings/models/trailColor';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { SupportTern } from './models/supportTern';
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
        <SubscriptionProvider repo={createMemorySubscriptionRepository(status)} userId={null}>
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
  it('says what Tern is for, and links to the coffee page in a test build', async () => {
    jest.spyOn(SupportTern, 'showCoffee').mockReturnValue(true);
    const open_ = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    open(PLUS);
    expect(await screen.findByText('What Tern promises')).toBeTruthy();
    fireEvent.press(screen.getByText('Buy me a coffee'));
    expect(open_).toHaveBeenCalledWith(SupportTern.COFFEE_URL);
  });

  it('never links outside the store in a store build', async () => {
    jest.spyOn(SupportTern, 'showCoffee').mockReturnValue(false);
    open(PLUS);
    expect(await screen.findByText('What Tern promises')).toBeTruthy();
    expect(screen.queryByText('Buy me a coffee')).toBeNull();
  });

  it('offers the tip jar, and thanks someone who tips', async () => {
    open(PLUS);
    fireEvent.press(await screen.findByLabelText('Tip $4.99'));
    expect(await screen.findByText('Thank you. That means a lot.')).toBeTruthy();
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
