import React from 'react';

import { Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { storeName } from '@shared/utils/storeApp';
import { useAuth } from '../../domain/auth/AuthContext';
import { useSubscription } from '../../domain/subscription/SubscriptionContext';
import { PlusAction, plusSummary } from '../models/plusSummary';
import { usePlusLapsed } from '../hooks/usePlusLapsed';
import { manageSubscription } from '../utils/manageSubscription';
import { logHome } from '../models/logHome';
import { LogHomeMark } from './LogHomeMark/LogHomeMark';

/**
 * Tern Plus in the profile card, right under the name: whether Tern Plus is on, when it
 * renews or ends, and the one thing to do about it from here (buy, make the account,
 * manage, or renew). Only with an account backend: sample data has no accounts to sync.
 */
export function PlusRow() {
  const auth = useAuth();
  const plus = useSubscription();
  const lapsed = usePlusLapsed();
  const toast = useToast();
  if (!auth) return null;

  const userId = auth.session?.user.id ?? null;
  const { title, summary, action } = plusSummary({
    signedIn: userId !== null,
    known: plus.checkedFor === userId && plus.known,
    lapsed,
    status: plus.status,
  });

  const store = storeName();
  const openStore = () =>
    manageSubscription().catch((e) => {
      console.warn('Could not open the store', e);
      toast.show(`Couldn't open ${store} — manage Tern Plus from its subscriptions page.`);
    });

  const press = () => {
    switch (action) {
      case PlusAction.Subscribe:
        // Making an account shows the paywall first when there's no Plus to skip it.
        auth.openSignIn({ toSignUp: true });
        return;
      case PlusAction.MakeAccount:
        // Bought, but no account yet: making one is the usual next step, and changing plan
        // or cancelling has to stay in reach too, since there's no account page to find it on.
        confirm({
          title: 'Tern Plus is on',
          message: `Make your account to start syncing your log. To change plan or cancel, go to ${store}.`,
          action: 'Make account',
          destructive: false,
          cancel: 'Not now',
          also: { text: `Open ${store}`, onPress: openStore },
          onConfirm: () => auth.openSignIn({ toSignUp: true }),
        });
        return;
      case PlusAction.Renew:
        auth.openSignIn();
        return;
      case PlusAction.Manage:
        // Says where cancelling is before leaving the app, and that it costs no data.
        confirm({
          title: 'Manage Tern Plus',
          message: `Change plan or cancel in ${store}. Your log stays either way: if Plus ends, it's kept on this phone.`,
          action: `Open ${store}`,
          destructive: false,
          cancel: 'Not now',
          onConfirm: openStore,
        });
        return;
      case PlusAction.None:
        return;
    }
  };

  const tappable = action !== PlusAction.None;
  return (
    <Row
      title={title}
      sub={summary}
      icon={
        <LogHomeMark home={logHome({ signedIn: userId !== null, lapsed })} />
      }
      chevron={tappable}
      onPress={tappable ? press : undefined}
    />
  );
}
