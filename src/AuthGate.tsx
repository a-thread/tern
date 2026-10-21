import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingScreen from '@shared/components/LoadingScreen/LoadingScreen';

import { isBackendConfigured } from '@shared/backend/supabase';
import { openLocalDb } from '@shared/backend/localDb.expo';
import { useToast } from '@shared/state/ToastContext';
import {
  type Backend,
  BackendProvider,
  createBlankMemoryBackend,
  createLocalBackend,
  createMemoryBackend,
  createRemoteBackend,
} from './BackendContext';
import { AuthProvider, useAuth } from './domain/auth/AuthContext';
import AuthFlow from './auth/AuthFlow';
import ResetPasswordScreen from './auth/reset-password/ResetPasswordScreen';

/**
 * Decides where the app's data comes from. Signed in, every repository is bound to that
 * session. Otherwise the app runs on the phone's own database, with no account needed;
 * signing in is something chosen from Settings. Without Supabase keys (development), the
 * app runs on in-memory sample data.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  if (!isBackendConfigured) return <SampleBackend>{children}</SampleBackend>;

  return (
    <AuthProvider>
      <RequireSession>{children}</RequireSession>
    </AuthProvider>
  );
}

function SampleBackend({ children }: { children: React.ReactNode }) {
  const [backend] = useState(createMemoryBackend);
  return <BackendProvider backend={backend}>{children}</BackendProvider>;
}

function RequireSession({ children }: { children: React.ReactNode }) {
  const auth = useAuth()!;
  const userId = auth.session?.user.id;
  const signedIn = Boolean(userId);
  const remote = useMemo(
    () => (signedIn ? createRemoteBackend() : null),
    [signedIn],
  );

  if (auth.loading) return <LoadingScreen />;

  // Arriving from a reset link: they're signed in, but must choose a new password first.
  if (signedIn && auth.passwordRecoveryPending) return <ResetPasswordScreen />;
  if (remote) {
    // Keyed by userId to refresh on identity changes
    return (
      <BackendProvider key={userId} backend={remote}>
        {children}
      </BackendProvider>
    );
  }
  if (auth.signingIn) return <AuthFlow />;
  return <PhoneBackend>{children}</PhoneBackend>;
}

/** The free tier: everything in the phone's database, opened once and kept across sign-ins. */
function PhoneBackend({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [backend, setBackend] = useState<Backend | null>(null);
  // Bumped after "Delete my data" or a restore, so every Context reloads from the database.
  const [generation, setGeneration] = useState(0);
  const restart = useCallback(() => setGeneration((g) => g + 1), []);

  useEffect(() => {
    let live = true;
    openLocalDb().then(
      (db) => {
        if (!live) return;
        const local = createLocalBackend(db);
        const data = local.data!;
        setBackend({
          ...local,
          data: {
            ...data,
            deleteAll: async () => {
              await data.deleteAll();
              restart();
            },
            deleteAccount: async () => {
              await data.deleteAccount();
              restart();
            },
            importAll: async (copy) => {
              const added = await data.importAll!(copy);
              restart();
              return added;
            },
          },
        });
      },
      (error) => {
        if (!live) return;
        // Rare (a full or damaged disk). Say so rather than lose what they log without a word.
        console.warn('Could not open the local database', error);
        toast.show("Couldn't open Tern's storage on this phone. Nothing will be saved for now.");
        setBackend(createBlankMemoryBackend());
      },
    );
    return () => {
      live = false;
    };
  }, [restart, toast]);

  if (!backend) return <LoadingScreen />;
  return (
    <BackendProvider key={`phone-${generation}`} backend={backend}>
      {children}
    </BackendProvider>
  );
}
