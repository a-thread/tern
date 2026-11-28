import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { takeRememberedJoin } from '../../navigation/pendingJoin';
import CreateAccountScreen from './CreateAccountScreen';

const mockAuth = { signUp: jest.fn(async () => {}) };
jest.mock('../../domain/auth/AuthContext', () => ({ useAuth: () => mockAuth }));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function fillIn() {
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CreateAccountScreen onCreated={jest.fn()} onBack={jest.fn()} />
    </SafeAreaProvider>,
  );
  fireEvent.changeText(screen.getByLabelText('First name'), 'Rudy');
  fireEvent.changeText(screen.getByLabelText('Email address'), 'r@x.co');
  fireEvent.changeText(screen.getByLabelText('Password'), 'longenough1');
  fireEvent.changeText(
    screen.getByLabelText('Confirm password'),
    'longenough1',
  );
}

describe('creating an account with an invite code', () => {
  beforeEach(async () => {
    mockAuth.signUp.mockClear();
    await takeRememberedJoin();
  });

  it('keeps a friend’s code, so Join opens with it once they’re in', async () => {
    fillIn();
    fireEvent.press(screen.getByText('Have an invite code from a friend?'));
    fireEvent.changeText(
      screen.getByLabelText('Invite code (optional)'),
      'ktw-4qp',
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });
    expect(mockAuth.signUp).toHaveBeenCalled();
    expect(await takeRememberedJoin()).toBe('KTW4QP');
  });

  it('won’t create the account with a code that can’t be one', async () => {
    fillIn();
    fireEvent.press(screen.getByText('Have an invite code from a friend?'));
    fireEvent.changeText(
      screen.getByLabelText('Invite code (optional)'),
      'KTW',
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it('keeps nothing without one', async () => {
    fillIn();
    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });
    expect(mockAuth.signUp).toHaveBeenCalled();
    expect(await takeRememberedJoin()).toBeNull();
  });
});
