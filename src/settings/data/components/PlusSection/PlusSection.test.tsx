import React from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { PlusSection } from './PlusSection';

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
const NONE: SubscriptionStatus = { active: false, renews: false, expiresAt: null };

type Button = { text: string; onPress?: () => void };
const buttons = () => (jest.mocked(Alert.alert).mock.calls[0][2] ?? []) as Button[];
const press = (text: string) => buttons().find((b) => b.text === text)!.onPress!();

function show(status: SubscriptionStatus, userId: string | null) {
  mockAuth.session = userId ? { user: { id: userId } } : null;
  return render(
    <ToastProvider>
      <SubscriptionProvider repo={createMemorySubscriptionRepository(status)} userId={userId}>
        <PlusSection />
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

describe('Tern Plus in Your data', () => {
  it('shows a synced account with a label, where to cancel, and what happens if Plus ends', async () => {
    show(RENEWING, 'me');
    expect(await screen.findByText('Synced to your account')).toBeTruthy();
    expect(screen.getByText('Tern Plus')).toBeTruthy();
    expect(screen.getByText(/Change plan or cancel in Google Play/)).toBeTruthy();
  });

  it('says where cancelling is before leaving for the store', async () => {
    show(RENEWING, 'me');
    fireEvent.press(await screen.findByText('Tern Plus · renews Nov 21'));
    const [title, message] = jest.mocked(Alert.alert).mock.calls[0];
    expect(title).toBe('Manage Tern Plus');
    expect(message).toMatch(/Change plan or cancel in Google Play/);
    expect(message).toMatch(/Your data stays either way/);
    await press('Open Google Play');
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('play.google.com/store/account/subscriptions'),
    );
  });

  it('keeps cancelling in reach when Plus is bought but there is no account yet', async () => {
    show(RENEWING, null);
    fireEvent.press(await screen.findByText('Tern Plus is on · make your account'));
    expect(buttons().map((b) => b.text)).toEqual(['Not now', 'Open Google Play', 'Make account']);
    press('Make account');
    expect(mockAuth.openSignIn).toHaveBeenCalledWith({ toSignUp: true });
  });

  it('is one short row with no label or footnote on the phone, pointing to the paywall', async () => {
    show(NONE, null);
    fireEvent.press(await screen.findByText('Learn about Tern Plus'));
    expect(screen.getByText('Kept on this phone')).toBeTruthy();
    expect(screen.queryByText('Tern Plus')).toBeNull();
    expect(screen.queryByText(/Change plan or cancel/)).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockAuth.openSignIn).toHaveBeenCalledWith({ toSignUp: true });
  });
});
