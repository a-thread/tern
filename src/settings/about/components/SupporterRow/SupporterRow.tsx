import React from 'react';
import { StyleSheet } from 'react-native';

import { colors, space } from '@shared/theme';
import { Group, Icon, IconBadge, Row } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { usePlusLapsed } from '@/settings/hooks/usePlusLapsed';
import { SupportOffer, supportOffer } from '../../models/supportOffer';

/** Only without Plus; subscribers see their plan under Your data. */
export function SupporterRow() {
  const auth = useAuth();
  const { active } = useSubscription();
  const lapsed = usePlusLapsed();
  const offer = supportOffer({
    accounts: auth !== null,
    signedIn: Boolean(auth?.session),
    active,
    lapsed,
  });
  if (!auth || offer === SupportOffer.None) return null;

  // Renewing signs back in; otherwise it's a new account. Either way the paywall shows
  // first, since there's no Plus to skip it.
  const join = () =>
    auth.session ? auth.openSignIn() : auth.openSignIn({ toSignUp: true });

  return (
    <Group style={s.apart}>
      <Row
        title='Become a Supporter'
        sub='Tern Plus every year, with a trail color for your tern'
        icon={
          <IconBadge bg={colors.sunTint}>
            <Icon name='feather' size={16} color={colors.sunDeep} />
          </IconBadge>
        }
        chevron
        onPress={join}
      />
    </Group>
  );
}

// Its own block under the tip card, not part of it.
const s = StyleSheet.create({ apart: { marginTop: space.md } });
