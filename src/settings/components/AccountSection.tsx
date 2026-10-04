import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { Group, GroupLabel, Row } from '@shared/components/ui';
import { useAuth } from '@shared/auth/AuthContext';

/** The app version, and signing out (or leaving the preview). */
export function AccountSection() {
  const auth = useAuth();
  return (
    <>
      <GroupLabel>About</GroupLabel>
      <Group>
        <Row title='Version' value='1.0.0' />
      </Group>

      {auth ? (
        <View style={s.signOut}>
          {auth.isGuest ? (
            <Pressable onPress={() => auth.signOut({ toSignUp: true })} hitSlop={8}>
              <Text style={s.createText}>Create account</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => auth.signOut()} hitSlop={8}>
            <Text style={s.signOutText}>{auth.isGuest ? 'Exit preview' : 'Sign out'}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  signOut: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  createText: { fontFamily: font.bold, fontSize: 14, color: colors.coral },
  signOutText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink2 },
});
