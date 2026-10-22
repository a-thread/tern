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
let mockSignedIn = true;
jest.mock('@/domain/auth/AuthContext', () => ({
  useAuth: () => ({
    session: mockSignedIn ? { user: { id: 'me' } } : null,
    signOut: jest.fn(),
  }),
}));

const repo: DataRepository = {
  exportAll: jest.fn(),
  deleteAll: jest.fn(),
  deleteAccount: jest.fn(),
  importAll: jest.fn(),
};

const PLUS: SubscriptionStatus = {
  active: true,
  renews: true,
  expiresAt: '2026-11-21T12:00:00.000Z',
};
const NONE: SubscriptionStatus = { active: false, renews: false, expiresAt: null };

/** Shows once the store has answered for whoever is here, so the test asks after that. */
function Checked() {
  return useSubscription().checkedFor === (mockSignedIn ? 'me' : null) ? (
    <Text>checked</Text>
  ) : null;
}

async function show(status: SubscriptionStatus) {
  render(
    <ToastProvider>
      <SubscriptionProvider
        repo={createMemorySubscriptionRepository(status)}
        userId={mockSignedIn ? 'me' : null}
      >
        <DataProvider repo={repo}>
          <Checked />
          <DataSection />
        </DataProvider>
      </SubscriptionProvider>
    </ToastProvider>,
  );
  await screen.findByText('checked');
}

async function deleteAccountWith(status: SubscriptionStatus) {
  await show(status);
  fireEvent.press(screen.getByText('Delete my account'));
  const [, message, buttons] = jest.mocked(Alert.alert).mock.calls[0];
  return { message: message!, labels: (buttons ?? []).map((b) => b.text) };
}

// Jest runs as iPhone by default; Tern Plus is on Google Play for now.
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
});
beforeEach(() => {
  mockSignedIn = true;
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('the rows, by where the data is', () => {
  it('with a synced account, every row says exactly what it touches', async () => {
    await show(PLUS);
    expect(screen.getByText('Save a file of everything, to restore from later')).toBeTruthy();
    expect(
      screen.getByText("Add back what's in a Tern export. Anything already here stays."),
    ).toBeTruthy();
    expect(
      screen.getByText("Erase everything you've logged. Your account and Tern Plus stay."),
    ).toBeTruthy();
    expect(screen.getByText('Close your account and erase all your data')).toBeTruthy();
  });

  it('once Tern Plus has ended, keeps it short and leaves out deleting the data alone', async () => {
    await show(NONE);
    expect(screen.getByText('Save a file of everything')).toBeTruthy();
    expect(screen.getByText("Add back what's in a Tern export")).toBeTruthy();
    expect(screen.queryByText('Delete my data')).toBeNull();
    expect(screen.getByText('Delete my account')).toBeTruthy();
  });

  it('without an account, offers deleting what is on this phone, and no account to delete', async () => {
    mockSignedIn = false;
    await show(NONE);
    expect(screen.getByText('Erase everything on this phone')).toBeTruthy();
    expect(screen.queryByText('Delete my account')).toBeNull();
  });
});

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
