import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import { LogOutSection } from './LogOutSection';

let mockSignedIn = true;
const mockSignOut = jest.fn();
jest.mock('@/domain/auth/AuthContext', () => ({
  useAuth: () => ({
    session: mockSignedIn ? { user: { id: 'me', email: 'me@example.com' } } : null,
    signOut: mockSignOut,
  }),
}));

function show() {
  render(
    <ToastProvider>
      <LogOutSection />
    </ToastProvider>,
  );
}

beforeEach(() => {
  mockSignedIn = true;
  mockSignOut.mockReset();
});

describe('LogOutSection', () => {
  it('logs out when pressed', async () => {
    mockSignOut.mockResolvedValue(undefined);
    show();
    expect(screen.getByText('me@example.com')).toBeTruthy();
    fireEvent.press(screen.getByText('Log out'));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });

  it('says so when logging out fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('offline'));
    show();
    fireEvent.press(screen.getByText('Log out'));
    expect(await screen.findByText("Couldn't log out — please try again.")).toBeTruthy();
  });

  it('is hidden when signed out', () => {
    mockSignedIn = false;
    show();
    expect(screen.queryByText('Log out')).toBeNull();
  });
});
