import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createMemorySettingsRepository } from '@/domain/settings/settings.repository';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { ToastProvider } from '@shared/state/ToastContext';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { ProfileSection } from './ProfileSection';

const mockAuth = {
  session: null as { user: { id: string; email: string } } | null,
  openSignIn: jest.fn(),
};
jest.mock('@/domain/auth/AuthContext', () => ({ useAuth: () => mockAuth }));

const PLUS: SubscriptionStatus = { active: true, renews: true, expiresAt: '2027-01-01T00:00:00Z' };
const ENDED: SubscriptionStatus = { active: false, renews: false, expiresAt: null };

function show(status: SubscriptionStatus, signedIn: boolean) {
  mockAuth.session = signedIn ? { user: { id: 'me', email: 'me@example.com' } } : null;
  return render(
    <ToastProvider>
      <SubscriptionProvider
        repo={createMemorySubscriptionRepository(status)}
        userId={signedIn ? 'me' : null}
      >
        <SettingsProvider repo={createMemorySettingsRepository()}>
          <ProfileSection />
        </SettingsProvider>
      </SubscriptionProvider>
    </ToastProvider>,
  );
}

beforeEach(() => mockAuth.openSignIn.mockClear());

describe('ProfileSection', () => {
  it('without an account, says the data is on this phone and opens sign-in', () => {
    show(ENDED, false);
    expect(screen.getByText('Saved on phone only')).toBeTruthy();
    expect(screen.queryByLabelText('First name')).toBeNull();
    fireEvent.press(screen.getByText('Sign in or create an account'));
    expect(mockAuth.openSignIn).toHaveBeenCalledWith();
  });

  it('with an account, shows the email and marks the avatar as synced', async () => {
    show(PLUS, true);
    expect(screen.getByLabelText('First name')).toBeTruthy();
    expect(screen.getByText('me@example.com')).toBeTruthy();
    expect(await screen.findByLabelText('Synced to your account')).toBeTruthy();
  });

  it('once Tern Plus has ended, marks the avatar with the phone, where the data is now', async () => {
    show(ENDED, true);
    expect(await screen.findByLabelText('Kept on this phone')).toBeTruthy();
  });
});
