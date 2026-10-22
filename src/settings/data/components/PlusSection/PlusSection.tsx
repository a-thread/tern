import React from 'react';

import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { storeName } from '@shared/utils/storeApp';
import { useAuth } from '@/domain/auth/AuthContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { PlusAction, plusSummary } from '../../../models/plusSummary';
import { usePlusLapsed } from '../../../hooks/usePlusLapsed';
import { manageSubscription } from '../../../utils/manageSubscription';
import { LogHome, logHome } from '../../../models/logHome';
import { LogHomeMark } from '../../../components/LogHomeMark/LogHomeMark';

/**
 * Tern Plus at the top of Your data: where the data is, the subscription's state, and the
 * one thing to do about it (manage, renew, make the account, or learn more). Synced, it gets
 * a label and a footnote; on the phone (Plus ended, or no account) it's one row, so the
 * screen stays short. Only with an account backend: sample data has no accounts to sync.
 */
export function PlusSection() {
  const auth = useAuth();
  const plus = useSubscription();
  const lapsed = usePlusLapsed();
  const toast = useToast();
  if (!auth) return null;

  const store = storeName();
  const userId = auth.session?.user.id ?? null;
  const home = logHome({ signedIn: userId !== null, lapsed });
  const { title, summary, link, footnote, action } = plusSummary({
    signedIn: userId !== null,
    known: plus.checkedFor === userId && plus.known,
    lapsed,
    status: plus.status,
    store,
  });

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
          message: `Make your account to start syncing your data. To change plan or cancel, go to ${store}.`,
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
          message: `Change plan or cancel in ${store}. Your data stays either way: if Plus ends, it's kept on this phone.`,
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
    <>
      {home === LogHome.Account ? <GroupLabel>Tern Plus</GroupLabel> : null}
      <Group>
        <Row
          title={title}
          sub={summary}
          subLink={link}
          icon={<LogHomeMark home={home} variant='badge' />}
          chevron={tappable}
          onPress={tappable ? press : undefined}
        />
      </Group>
      {footnote ? <FootNote>{footnote}</FootNote> : null}
    </>
  );
}
