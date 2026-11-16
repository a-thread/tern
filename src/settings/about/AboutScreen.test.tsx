import React from 'react';
import { AccessibilityInfo, Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '@/domain/subscription/subscription.repository';
import { SubscriptionProvider } from '@/domain/subscription/SubscriptionContext';
import { AboutLinks } from './models/aboutLinks';
import AboutScreen from './AboutScreen';

// Null is local data with no accounts; a test sets it to try the account backend.
let mockAuth: { session: null; openSignIn: jest.Mock } | null = null;
jest.mock('@/domain/auth/AuthContext', () => ({ useAuth: () => mockAuth }));

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
const NO_PLUS: SubscriptionStatus = {
  active: false,
  renews: false,
  expiresAt: null,
};

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
          </SettingsProvider>
        </SubscriptionProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  mockAuth = null;
});

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
      await screen.findByText(/never for the scale or a calorie count/),
    ).toBeTruthy();
  });

  it('folds the letter to its first paragraph until it is opened', async () => {
    open(PLUS);
    expect(await screen.findByText(/I made Tern for myself/)).toBeTruthy();
    expect(screen.queryByText(/I hope you get some joy/)).toBeNull();
    expect(screen.queryByText('Email Aiden')).toBeNull();

    fireEvent.press(
      screen.getByRole('button', { name: 'Read the whole letter' }),
    );
    expect(screen.getByText(/I hope you get some joy/)).toBeTruthy();
    expect(screen.getByText('Email Aiden')).toBeTruthy();
    expect(screen.queryByText('Read the whole letter')).toBeNull();
  });

  it('has a letter from Aiden, with the source code and a way to write', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    open(PLUS);
    expect(await screen.findByText('A letter from Aiden')).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', { name: 'Read the whole letter' }),
    );
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

  it('offers Supporter to someone signed out, through the paywall', async () => {
    const openSignIn = jest.fn();
    mockAuth = { session: null, openSignIn };
    open(NO_PLUS);
    fireEvent.press(await screen.findByText('Become a Supporter'));
    expect(openSignIn).toHaveBeenCalledWith({ toSignUp: true });
  });

  it('asks nothing of someone with Plus or Supporter, and leaves the trail to Journey', async () => {
    mockAuth = { session: null, openSignIn: jest.fn() };
    open(SUPPORTER);
    expect(await screen.findByText('Bring Tern a fish')).toBeTruthy();
    expect(screen.queryByText('Become a Supporter')).toBeNull();
    expect(screen.queryByText('You’re a Supporter')).toBeNull();
    expect(screen.queryByLabelText('Twilight trail')).toBeNull();
    screen.unmount();

    open(PLUS);
    expect(await screen.findByText('Bring Tern a fish')).toBeTruthy();
    expect(screen.queryByText('Become a Supporter')).toBeNull();
    expect(screen.queryByText('You have Tern Plus')).toBeNull();
  });
});
