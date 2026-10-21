import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { useAuth } from '../../domain/auth/AuthContext';
import { plusUnlocked } from '../../domain/subscription/plusUnlocked';

/** Signing in or out, and the app version, at the foot of Settings. */
export function AccountSection() {
  const auth = useAuth();
  return (
    <>
      {auth ? (
        <View style={s.signOut}>
          {auth.session ? (
            <Pressable
              onPress={() => auth.signOut()}
              hitSlop={8}
              accessibilityRole='button'
            >
              <Text style={s.signOutText}>Sign out</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => auth.openSignIn({ toSignUp: true })}
                hitSlop={8}
                accessibilityRole='button'
              >
                <Text style={s.createText}>Create account</Text>
              </Pressable>
              <Pressable
                onPress={() => auth.openSignIn()}
                hitSlop={8}
                accessibilityRole='button'
              >
                <Text style={s.signOutText}>Sign in</Text>
              </Pressable>
            </>
          )}
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
  createText: { fontFamily: font.bold, fontSize: 14, color: colors.coral },
  signOutText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink2 },
  version: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: space.md,
  },
});
