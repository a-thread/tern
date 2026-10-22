import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { useAuth } from '../../domain/auth/AuthContext';
import { plusUnlocked } from '../../domain/subscription/plusUnlocked';

/**
 * Signing out, and the app version, at the foot of Settings. Signing in (and making an
 * account) is the profile card at the top; Tern Plus is in Your data.
 */
export function AccountSection() {
  const auth = useAuth();
  return (
    <>
      {auth?.session ? (
        <View style={s.signOut}>
          <Pressable onPress={() => auth.signOut()} hitSlop={8} accessibilityRole='button'>
            <Text style={s.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={s.version}>
        {plusUnlocked() ? 'Tern 1.0.0 · test build, Tern Plus unlocked' : 'Tern 1.0.0'}
      </Text>
    </>
  );
}

const s = StyleSheet.create({
  signOut: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  signOutText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink2 },
  version: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: space.md,
  },
});
