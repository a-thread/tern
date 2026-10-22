import React from 'react';
import { Alert, Platform, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import { DataProvider } from '@/domain/settings/DataContext';
import type { DataRepository } from '@/domain/settings/dataRepository';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import {
  SubscriptionProvider,
  useSubscription,
} from '@/domain/subscription/SubscriptionContext';
import { DataSection } from './DataSection';

jest.mock('../utils/backupFile', () => ({}));
jest.mock('@/domain/auth/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'me' } }, signOut: jest.fn() }),
}));

const repo: DataRepository = {
  exportAll: jest.fn(),
  deleteAll: jest.fn(),
  deleteAccount: jest.fn(),
};

/** Shows once the store has answered for the account, so the test asks after that. */
function Checked() {
  return useSubscription().checkedFor === 'me' ? <Text>checked</Text> : null;
}

async function deleteAccountWith(status: SubscriptionStatus) {
  render(
    <ToastProvider>
      <SubscriptionProvider repo={createMemorySubscriptionRepository(status)} userId='me'>
        <DataProvider repo={repo}>
          <Checked />
          <DataSection />
        </DataProvider>
      </SubscriptionProvider>
    </ToastProvider>,
  );
  await screen.findByText('checked');
  fireEvent.press(screen.getByText('Delete my account'));
  const [, message, buttons] = jest.mocked(Alert.alert).mock.calls[0];
  return { message: message!, labels: (buttons ?? []).map((b) => b.text) };
}

// Jest runs as iPhone by default; Tern Plus is on Google Play for now.
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
});
beforeEach(() => jest.spyOn(Alert, 'alert').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

describe('Delete my account', () => {
  it("warns that it doesn't cancel a subscription that will charge again, and offers the store", async () => {
    const { message, labels } = await deleteAccountWith({
      active: true,
      renews: true,
      expiresAt: '2026-11-21T12:00:00.000Z',
    });
    expect(message).toMatch(/doesn't cancel Tern Plus\. Cancel it in Google Play first/);
    expect(labels).toEqual(['Cancel', 'Open Google Play', 'Delete account']);
  });

  it('says nothing about Plus when nothing will be charged', async () => {
    const { message, labels } = await deleteAccountWith({
      active: true,
      renews: false,
      expiresAt: null,
    });
    expect(message).not.toMatch(/Tern Plus/);
    expect(labels).toEqual(['Cancel', 'Delete account']);
  });
});
