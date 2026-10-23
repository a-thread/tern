import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AccountSection } from './AccountSection';

jest.mock('@/domain/auth/AuthContext', () => ({ useAuth: () => ({ session: null }) }));

const mockConfig: { version?: string } = {};
// A getter, because the hoisted import evaluates this factory before mockConfig is assigned.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockConfig;
    },
  },
}));

const PLUS_UNLOCKED = process.env.EXPO_PUBLIC_PLUS_UNLOCKED;
afterEach(() => {
  process.env.EXPO_PUBLIC_PLUS_UNLOCKED = PLUS_UNLOCKED;
});

describe('AccountSection', () => {
  it('shows the version the build was made with', () => {
    mockConfig.version = '0.2.3';
    render(<AccountSection />);
    expect(screen.getByText('Tern 0.2.3')).toBeTruthy();
  });

  it('says when it is a test build with Tern Plus unlocked', () => {
    mockConfig.version = '0.2.3';
    process.env.EXPO_PUBLIC_PLUS_UNLOCKED = '1';
    render(<AccountSection />);
    expect(screen.getByText('Tern 0.2.3 · test build, Tern Plus unlocked')).toBeTruthy();
  });

  it('shows just the name when the version is unknown', () => {
    delete mockConfig.version;
    render(<AccountSection />);
    expect(screen.getByText('Tern')).toBeTruthy();
  });
});
