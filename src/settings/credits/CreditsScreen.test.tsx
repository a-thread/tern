import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider, useSettings } from '@/domain/settings/SettingsContext';
import { TrailColor } from '@/domain/settings/models/trailColor';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import CreditsScreen from './CreditsScreen';

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
            <CreditsScreen />
            <TrailProbe />
          </SettingsProvider>
        </SubscriptionProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('CreditsScreen', () => {
  it('lets a Supporter choose their trail and ask to be listed', async () => {
    open(SUPPORTER);
    fireEvent.press(await screen.findByLabelText('Twilight trail'));
    await waitFor(() => expect(trail).toBe(TrailColor.Twilight));
    expect(screen.getByText('Ask to be listed')).toBeTruthy();
  });

  it('offers no trail or listing to someone on plain Plus', async () => {
    open(PLUS);
    expect(await screen.findByText('No names here yet')).toBeTruthy();
    expect(screen.queryByLabelText('Twilight trail')).toBeNull();
    expect(screen.queryByText('Ask to be listed')).toBeNull();
  });
});
