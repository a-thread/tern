import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
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
 * Signed out: the phone. Signed in with Plus: the account (the phone moves in first). Plus
 * ended: the phone, with the account's log copied down. No Supabase keys: sample data.
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

/** Above sign-in, since buying comes first. Asks the server too, so hand grants count. */
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
    return (
      <SignInOver
        open={auth.signingIn}
        onClose={auth.closeSignIn}
        screens={<AuthFlow />}
      >
        <PhoneBackend>{children}</PhoneBackend>
      </SignInOver>
    );
  }
  // Arriving from a reset link: they're signed in, but must choose a new password first.
  if (auth.passwordRecoveryPending) return <ResetPasswordScreen />;
  if (!settled) return <LoadingScreen />;
  if (lapsed) {
    return (
      <SignInOver
        open={auth.signingIn}
        onClose={auth.closeSignIn}
        screens={<PaywallScreen onBack={auth.closeSignIn} />}
      >
        <PhoneBackend lapsed={{ userId, account: remote.data! }}>
          {children}
        </PhoneBackend>
      </SignInOver>
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
 * Over the app, not in place of it, so closing returns where you were. A `Modal` because iOS
 * draws the Settings sheet above any root-view overlay.
 */
function SignInOver({
  open,
  onClose,
  screens,
  children,
}: {
  open: boolean;
  onClose: () => void;
  screens: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={s.fill}>
      <View
        style={s.fill}
        importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={open}
      >
        {children}
      </View>
      <Modal
        visible={open}
        animationType='slide'
        presentationStyle='fullScreen'
        // Edge to edge on Android, as the app is, so the screens' safe-area insets still fit.
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={onClose}
      >
        {open ? screens : null}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({ fill: { flex: 1 } });

/** Said once the account's log is on the phone because the server doesn't count Plus yet. */
const NOT_SYNCED_NOTICE =
  "Your account can't sync yet, so Tern is saving to this phone for now. It moves into your account once Tern Plus is confirmed.";

/**
 * Syncs the server's Plus record first, since it gates writes. If the server says no, falls
 * back to the phone; otherwise `moveIn` uploads the phone's log.
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
  const [ready, setReady] = useState(false);
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    let live = true;
    // null when offline: benefit of the doubt, since no save would reach it anyway.
    const sync = async () => {
      try {
        return (await backend.syncPlus?.()) ?? true;
      } catch (e) {
        console.warn('Could not bring the server up to date with Tern Plus', e);
        return null;
      }
    };
    sync()
      .then(async (synced) => {
        // The account would refuse every row: stay on the phone, and leave its log there.
        if (synced === false) {
          console.warn(
            "The server doesn't count Tern Plus yet; using the phone",
          );
          if (live) setRefused(true);
          return 0;
        }
        // Nothing is moved on a Plus the store didn't confirm, or the server couldn't.
        if (synced === null || !moveIn) return 0;
        const db = await openLocalDb();
        return moveToAccount(
          createLocalBackend(db).data!,
          backend.data!,
          db,
          userId,
        );
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
  if (refused) {
    return (
      <PhoneBackend
        lapsed={{ userId, account: backend.data!, notice: NOT_SYNCED_NOTICE }}
      >
        {children}
      </PhoneBackend>
    );
  }
  return <BackendProvider backend={backend}>{children}</BackendProvider>;
}

/** Opened once and kept across sign-ins; `lapsed` copies the account's log down first. */
function PhoneBackend({
  lapsed,
  children,
}: {
  /** `notice` replaces the "Plus has ended" message shown once the account's log is copied. */
  lapsed?: { userId: string; account: DataRepository; notice?: string };
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [backend, setBackend] = useState<Backend | null>(null);
  const lapsedFor = lapsed?.userId;
  const account = lapsed?.account;
  const notice = lapsed?.notice;

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
              notice ??
                'Tern Plus has ended, so your data is kept on this phone now. Renew in Settings › Account and data to sync it again.',
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
        toast.show(
          "Couldn't open Tern's storage on this phone. Nothing will be saved for now.",
        );
        setBackend(createBlankMemoryBackend());
      },
    );
    return () => {
      live = false;
    };
  }, [toast, lapsedFor, account, notice]);

  if (!backend) return <LoadingScreen />;
  return (
    <BackendProvider key={`phone-${lapsedFor ?? ''}`} backend={backend}>
      {children}
    </BackendProvider>
  );
}
