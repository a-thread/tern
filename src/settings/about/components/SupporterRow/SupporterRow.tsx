import React from 'react';

import { colors } from '@shared/theme';
import { Group, Icon, IconBadge, Row } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { usePlusLapsed } from '@/settings/hooks/usePlusLapsed';
import { SupportOffer, supportOffer } from '../../models/supportOffer';

/**
 * Under the tip jar: the way to become a Supporter, or a thank-you to someone already on
 * Plus or Supporter. Nothing without an account backend and no Plus.
 */
export function SupporterRow() {
  const auth = useAuth();
  const { active, supporter } = useSubscription();
  const lapsed = usePlusLapsed();
  const offer = supportOffer({
    accounts: auth !== null,
    signedIn: Boolean(auth?.session),
    active,
    supporter,
    lapsed,
  });

  const badge = (
    <IconBadge bg={colors.sunTint}>
      <Icon name='feather' size={16} color={colors.sunDeep} />
    </IconBadge>
  );

  switch (offer) {
    case SupportOffer.Join: {
      // Renewing signs back in; otherwise it's a new account. Either way the paywall
      // shows first, since there's no Plus to skip it.
      const join = () => {
        if (!auth) return;
        if (auth.session && lapsed) auth.openSignIn();
        else auth.openSignIn({ toSignUp: true });
      };
      return (
        <Group>
          <Row
            title='Become a Supporter'
            sub='Tern Plus every year, with a trail colour for your tern'
            icon={badge}
            chevron
            onPress={join}
          />
        </Group>
      );
    }
    case SupportOffer.PlusThanks:
      return (
        <Group>
          <Row
            title='You have Tern Plus'
            sub='That keeps Tern running. Thank you.'
            icon={badge}
          />
        </Group>
      );
    case SupportOffer.SupporterThanks:
      return (
        <Group>
          <Row
            title='You’re a Supporter'
            sub='Thank you. Choose your trail colour below.'
            icon={badge}
          />
        </Group>
      );
    case SupportOffer.None:
      return null;
  }
}
