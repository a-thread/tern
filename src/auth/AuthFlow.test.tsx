import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  NO_SUBSCRIPTION,
  type SubscriptionStatus,
} from '../domain/subscription/models/subscription';
import { createMemorySubscriptionRepository } from '../domain/subscription/subscription.repository';
import { SubscriptionProvider } from '../domain/subscription/SubscriptionContext';
import AuthFlow from './AuthFlow';

const mockAuth = {
  startOnSignUp: true,
  closeSignIn: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  sendPasswordReset: jest.fn(),
};
jest.mock('../domain/auth/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function app(status: SubscriptionStatus = NO_SUBSCRIPTION) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <SubscriptionProvider
        repo={createMemorySubscriptionRepository(status)}
        userId={null}
      >
        <AuthFlow />
      </SubscriptionProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockAuth.startOnSignUp = true;
  mockAuth.closeSignIn.mockClear();
});

describe('AuthFlow and Tern Plus', () => {
  it('puts the paywall in front of making an account', async () => {
    app();
    expect(await screen.findByText('Tern Plus')).toBeTruthy();
    expect(screen.getByLabelText('Yearly, $29.99 a year')).toBeTruthy();
    expect(screen.queryByText("Let's get started")).toBeNull();
  });

  it('goes on to the sign-up form once a plan is bought', async () => {
    app();
    fireEvent.press(await screen.findByText('Continue'));
    expect(await screen.findByText("Let's get started")).toBeTruthy();
  });

  it('skips the paywall for someone who already has Plus', async () => {
    app({ active: true, renews: true, expiresAt: null });
    expect(await screen.findByText("Let's get started")).toBeTruthy();
    expect(screen.queryByText('Tern Plus')).toBeNull();
  });

  it('"Not now" from Settings goes back to the app', async () => {
    app();
    fireEvent.press(await screen.findByText('Not now'));
    expect(mockAuth.closeSignIn).toHaveBeenCalled();
  });

  it('leaves signing in to an existing account open', async () => {
    mockAuth.startOnSignUp = false;
    app();
    expect(await screen.findByText('Sign in')).toBeTruthy();
    expect(screen.queryByText('Tern Plus')).toBeNull();
  });
});
