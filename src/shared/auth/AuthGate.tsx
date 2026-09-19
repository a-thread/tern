import React, { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@shared/theme';
import { isBackendConfigured } from '@shared/backend/supabase';
import {
  BackendProvider,
  createMemoryBackend,
  createRemoteBackend,
} from '@shared/state/BackendContext';
import { AuthProvider, useAuth } from './AuthContext';
import AuthScreen from './AuthScreen';

/**
 * Decides where the app's data comes from. With Supabase keys configured,
 * nothing renders until the user is signed in, and every repository is bound
 * to that session. Without keys, the app runs on local mock data.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  if (!isBackendConfigured) return <LocalBackend>{children}</LocalBackend>;
  return (
    <AuthProvider>
      <RequireSession>{children}</RequireSession>
    </AuthProvider>
  );
}

function LocalBackend({ children }: { children: React.ReactNode }) {
  const [backend] = useState(createMemoryBackend);
  return <BackendProvider backend={backend}>{children}</BackendProvider>;
}

function RequireSession({ children }: { children: React.ReactNode }) {
  const auth = useAuth()!;
  const userId = auth.session?.user.id;
  const backend = useMemo(
    () => (userId ? createRemoteBackend() : null),
    [userId],
  );

  if (auth.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }
  if (!backend) return <AuthScreen />;

  // Keyed by user so signing out and in as someone else remounts every provider with fresh state.
  return (
    <BackendProvider key={userId} backend={backend}>
      {children}
    </BackendProvider>
  );
}
