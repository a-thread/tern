import React, { useEffect, useMemo, useState } from 'react';
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
  createServerPlusGrant,
  createSubscriptionRepository,
} from './BackendContext';
import { AuthProvider, useAuth } from './domain/auth/AuthContext';
import type { DataRepository } from './domain/settings/dataRepository';
import {
  SubscriptionProvider,
  useSubscription,
} from './domain/subscription/SubscriptionContext';
import { isPlusLapsed } from './domain/subscription/models/subscription';
import AuthFlow from './auth/AuthFlow';
import PaywallScreen from './auth/paywall/PaywallScreen';
import ResetPasswordScreen from './auth/reset-password/ResetPasswordScreen';
import { copyToPhone, lapsedData, moveToAccount } from './accountMoves';

/**
 * Decides where the app's data comes from, under Tern Plus (which outlives signing in and
 * out, since buying comes before the account).
 *
 * - Signed out: the phone's own database. Signing in is something chosen from Settings.
 * - Signed in with Plus: the account. Anything on the phone is moved into it first.
 * - Signed in, Plus ended: the phone again, with the account's log copied onto it, so
 *   nothing is lost and nothing stops working. Renewing moves it all back.
 *
 * Without Supabase keys (development), the app runs on in-memory sample data.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  if (!isBackendConfigured) {
    return (
      <Plus userId={null}>
        <SampleBackend>{children}</SampleBackend>
      </Plus>
    );
  }

  return (
    <AuthProvider>
      <RequireSession>{children}</RequireSession>
    </AuthProvider>
  );
}

/**
 * Tern Plus, above the sign-in screens: buying comes before making an account. Signed in,
 * the server is asked too, so Plus granted by hand (testers, grandfathered accounts) counts.
 */
function Plus({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [repo] = useState(createSubscriptionRepository);
  const [serverGrant] = useState(createServerPlusGrant);
  return (
    <SubscriptionProvider
      repo={repo}
      userId={userId}
      serverGrant={userId ? serverGrant : undefined}
    >
      {children}
    </SubscriptionProvider>
  );
}

function SampleBackend({ children }: { children: React.ReactNode }) {
  const [backend] = useState(createMemoryBackend);
  return <BackendProvider backend={backend}>{children}</BackendProvider>;
}

function RequireSession({ children }: { children: React.ReactNode }) {
  const auth = useAuth()!;
  const userId = auth.session?.user.id;
  return (
    <Plus userId={userId ?? null}>
      <ChooseBackend>{children}</ChooseBackend>
    </Plus>
  );
}

function ChooseBackend({ children }: { children: React.ReactNode }) {
  const auth = useAuth()!;
  const plus = useSubscription();
  const userId = auth.session?.user.id ?? null;
  const remote = useMemo(
    () => (userId ? createRemoteBackend() : null),
    [userId],
  );
  // The store has answered for this account (not still the phone, from before signing in).
  const settled = plus.checkedFor === userId;
  const lapsed = isPlusLapsed(userId, plus);

  // Renewed from the paywall in Settings: the sign-in screens are done with.
  const { signingIn, closeSignIn } = auth;
  useEffect(() => {
    if (userId && plus.active && signingIn) closeSignIn();
  }, [userId, plus.active, signingIn, closeSignIn]);

  if (auth.loading) return <LoadingScreen />;

  if (!userId || !remote) {
    if (auth.signingIn) return <AuthFlow />;
    return <PhoneBackend>{children}</PhoneBackend>;
  }
  // Arriving from a reset link: they're signed in, but must choose a new password first.
  if (auth.passwordRecoveryPending) return <ResetPasswordScreen />;
  if (!settled) return <LoadingScreen />;
  if (lapsed) {
    if (auth.signingIn) return <PaywallScreen onBack={auth.closeSignIn} />;
    return (
      <PhoneBackend lapsed={{ userId, account: remote.data! }}>
        {children}
      </PhoneBackend>
    );
  }
  return (
    // Keyed by userId to refresh on identity changes. A store that couldn't be reached
    // gets the benefit of the doubt: the account, with nothing moved.
    <AccountBackend
      key={userId}
      userId={userId}
      backend={remote}
      moveIn={plus.active}
    >
      {children}
    </AccountBackend>
  );
}

/**
 * Signed in with Plus. The server's record of Plus is brought up to date first (it's what
 * lets the account be written to), then whatever is on the phone goes into the account
 * before it shows.
 */
function AccountBackend({
  userId,
  backend,
  moveIn,
  children,
}: {
  userId: string;
  backend: Backend;
  moveIn: boolean;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [ready, setReady] = useState(!moveIn);

  useEffect(() => {
    if (!moveIn) return;
    let live = true;
    // Whether the server now counts Plus. Usually the webhook has already done it.
    const sync = async () => {
      try {
        return (await backend.syncPlus?.()) ?? true;
      } catch (e) {
        console.warn('Could not bring the server up to date with Tern Plus', e);
        return false;
      }
    };
    sync()
      .then(async (synced) => {
        // The account would refuse every row: leave the phone's log where it is for next time.
        if (!synced) {
          console.warn("The server doesn't count Tern Plus yet; the phone's log stays on it");
          return 0;
        }
        const db = await openLocalDb();
        return moveToAccount(createLocalBackend(db).data!, backend.data!, db, userId);
      })
      .then((added) => {
        if (added) {
          toast.show(
            `Moved ${added} ${added === 1 ? 'entry' : 'entries'} from this phone into your account.`,
          );
        }
      })
      .catch((e) => {
        // Nothing on the phone was cleared, so it's tried again next time.
        console.warn("Could not move the phone's log into the account", e);
        toast.show(
          "Couldn't move this phone's data into your account yet. It's safe on the phone, and Tern will try again.",
        );
      })
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [backend, moveIn, toast, userId]);

  if (!ready) return <LoadingScreen />;
  return <BackendProvider backend={backend}>{children}</BackendProvider>;
}

/**
 * Everything in the phone's database, opened once and kept across sign-ins: the free
 * tier, and where a signed-in account lands when its Plus has ended (`lapsed`), with the
 * account's log copied on first.
 */
function PhoneBackend({
  lapsed,
  children,
}: {
  lapsed?: { userId: string; account: DataRepository };
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [backend, setBackend] = useState<Backend | null>(null);
  const lapsedFor = lapsed?.userId;
  const account = lapsed?.account;

  useEffect(() => {
    let live = true;
    // Switching between the phone's own log and a lapsed account's: show neither until ready.
    setBackend(null);
    const open = async (): Promise<Backend> => {
      const db = await openLocalDb();
      const local = createLocalBackend(db);
      if (lapsedFor && account) {
        try {
          if (await copyToPhone(account, local.data!, db, lapsedFor)) {
            toast.show(
              'Tern Plus has ended, so your data is kept on this phone now. Renew in Settings › Your data to sync it again.',
            );
          }
        } catch (e) {
          // Carry on with what the phone has; the copy is tried again next time.
          console.warn("Could not copy the account's log onto the phone", e);
          toast.show(
            "Tern Plus has ended, and your account's data couldn't be copied onto this phone yet. Tern will try again.",
          );
        }
      }
      return lapsedFor && account
        ? { ...local, data: lapsedData(local.data!, account) }
        : local;
    };
    open().then(
      (next) => live && setBackend(next),
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
  }, [toast, lapsedFor, account]);

  if (!backend) return <LoadingScreen />;
  return (
    <BackendProvider key={`phone-${lapsedFor ?? ''}`} backend={backend}>
      {children}
    </BackendProvider>
  );
}
