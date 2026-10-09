import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { useAuth } from '@shared/auth/AuthContext';

/** Signing out (or leaving the preview), and the app version, at the foot of Settings. */
export function AccountSection() {
  const auth = useAuth();
  return (
    <>
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
      <Text style={s.version}>Tern 1.0.0</Text>
    </>
  );
}

const s = StyleSheet.create({
  signOut: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  createText: { fontFamily: font.bold, fontSize: 14, color: colors.coral },
  signOutText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink2 },
  version: { fontFamily: font.body, fontSize: 11.5, color: colors.ink3, textAlign: 'center', marginTop: space.md },
});
