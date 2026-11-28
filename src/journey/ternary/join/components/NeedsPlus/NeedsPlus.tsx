import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, space, typography } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { rememberJoin } from '@/navigation/pendingJoin';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { TernaryButton } from '@/journey/ternary/components/TernaryButton/TernaryButton';

/**
 * Joining without Tern Plus: what it needs, and the way to it. The code is kept, so once
 * they're in, Join opens again with it filled in.
 */
export function NeedsPlus({ code }: { code: string }) {
  const auth = useAuth();
  const navigation = useTernaryNavigation();
  const hasCode = code.length === TernaryRules.INVITE_LENGTH;

  const getPlus = () => {
    if (!auth) return;
    if (hasCode) rememberJoin(code);
    // Signed in with Plus ended: the paywall. Otherwise a new account, paywall first.
    if (auth.session) auth.openSignIn();
    else auth.openSignIn({ toSignUp: true });
  };

  return (
    <View>
      <Card style={s.card}>
        <Text style={typography.heading}>Ternaries come with Tern Plus</Text>
        <Text style={s.para}>
          Friends fly together through Tern’s server, so everyone in a ternary
          has an account with Tern Plus.
          {hasCode
            ? ' Your invite is kept, and you’ll come straight back here to join once you’re in.'
            : ''}
        </Text>
        {hasCode ? (
          <Text
            style={s.code}
            accessibilityLabel={`Invite code ${code.split('').join(' ')}`}
          >
            {code}
          </Text>
        ) : null}
      </Card>
      {auth ? (
        <TernaryButton
          label={auth.session ? 'Renew Tern Plus' : 'Get Tern Plus'}
          onPress={getPlus}
        />
      ) : null}
      <TernaryButton
        label='Not now'
        outline
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginTop: space.md },
  para: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
  code: {
    fontFamily: font.bold,
    fontSize: 24,
    letterSpacing: 6,
    color: colors.ink,
    textAlign: 'center',
    marginTop: space.md,
  },
});
