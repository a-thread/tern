import React from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { PlusRow } from './PlusRow';

const mockAuth = {
  session: null as { user: { id: string } } | null,
  openSignIn: jest.fn(),
};
jest.mock('@/domain/auth/AuthContext', () => ({ useAuth: () => mockAuth }));

const RENEWING: SubscriptionStatus = {
  active: true,
  renews: true,
  expiresAt: '2026-11-21T12:00:00.000Z',
};

type Button = { text: string; onPress?: () => void };
const buttons = () => (jest.mocked(Alert.alert).mock.calls[0][2] ?? []) as Button[];
const press = (text: string) => buttons().find((b) => b.text === text)!.onPress!();

function show(status: SubscriptionStatus, userId: string | null) {
  mockAuth.session = userId ? { user: { id: userId } } : null;
  return render(
    <ToastProvider>
      <SubscriptionProvider repo={createMemorySubscriptionRepository(status)} userId={userId}>
        <PlusRow />
      </SubscriptionProvider>
    </ToastProvider>,
  );
}

// Jest runs as iPhone by default; Tern Plus is on Google Play for now.
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
});

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  mockAuth.openSignIn.mockClear();
});
afterEach(() => jest.restoreAllMocks());

describe('Manage subscription', () => {
  it('says where cancelling is before leaving for the store', async () => {
    show(RENEWING, 'me');
    fireEvent.press(await screen.findByText('Tern Plus · renews Nov 21'));
    const [title, message] = jest.mocked(Alert.alert).mock.calls[0];
    expect(title).toBe('Manage Tern Plus');
    expect(message).toMatch(/Change plan or cancel in Google Play/);
    expect(message).toMatch(/kept on this phone/);
    await press('Open Google Play');
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('play.google.com/store/account/subscriptions'),
    );
  });

  it('keeps cancelling in reach when Plus is bought but there is no account yet', async () => {
    show(RENEWING, null);
    fireEvent.press(
      await screen.findByText('Tern Plus is on · make an account to start syncing'),
    );
    expect(buttons().map((b) => b.text)).toEqual(['Not now', 'Open Google Play', 'Make account']);
    press('Make account');
    expect(mockAuth.openSignIn).toHaveBeenCalledWith({ toSignUp: true });
    await press('Open Google Play');
    expect(Linking.openURL).toHaveBeenCalled();
  });

  it('goes straight to the paywall when there is no Plus', async () => {
    show({ active: false, renews: false, expiresAt: null }, null);
    fireEvent.press(await screen.findByText('Tern Plus is off · sync and back up your log'));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockAuth.openSignIn).toHaveBeenCalledWith({ toSignUp: true });
  });
});
