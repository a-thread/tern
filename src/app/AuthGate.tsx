import React, { useMemo, useState } from 'react';
import LoadingScreen from '@shared/components/LoadingScreen';

import { isBackendConfigured } from '@shared/backend/supabase';
import {
  BackendProvider,
  createMemoryBackend,
  createRemoteBackend,
} from './BackendContext';
import { AuthProvider, useAuth } from '@shared/auth/AuthContext';
import AuthFlow from '@shared/auth/AuthFlow';
import ResetPasswordScreen from '@shared/auth/ResetPasswordScreen';

/**
 * Decides where the app's data comes from. With Supabase keys configured,
 * you must sign in (or choose to preview without an account) before
 * anything renders, and every repository is bound to that session. Without
 * keys, the app runs on local mock data.
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
  const signedIn = Boolean(userId);
  const inPreview = !signedIn && auth.isGuest;

  // A real user gets repositories bound to their session; a preview gets a
  // fresh in-memory backend (mock data that is never saved).
  const backend = useMemo(() => {
    if (signedIn) return createRemoteBackend();
    if (inPreview) return createMemoryBackend();
    return null;
  }, [signedIn, inPreview]);

  if (auth.loading) return <Spinner />;
  // Arriving from a reset link: they're signed in, but must choose a new password first.
  if (signedIn && auth.passwordRecoveryPending) return <ResetPasswordScreen />;
  if (!backend) return <AuthFlow />;

  // Keyed so signing out and in as someone else remounts every provider with fresh state.
  return (
    <BackendProvider key={userId ?? 'preview'} backend={backend}>
      {children}
    </BackendProvider>
  );
}

function Spinner() {
  return (
    <LoadingScreen />
  );
}
