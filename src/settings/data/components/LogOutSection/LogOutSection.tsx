import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography } from '@shared/theme';
import { Group, GroupLabel } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';

/**
 * Log out, at the foot of Account and data. Only shown signed in; once the session ends,
 * Tern goes back to the sign-in flow on its own.
 */
export function LogOutSection() {
  const auth = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!auth?.session) return null;

  const logOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await auth.signOut();
    } catch (e) {
      console.warn('Could not log out', e);
      toast.show("Couldn't log out — please try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <GroupLabel>Account</GroupLabel>
      <Group>
        <Pressable style={s.row} onPress={logOut} disabled={busy} accessibilityRole='button'>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Log out</Text>
            <Text style={s.sub}>{auth.session.user.email ?? 'End this session on this phone'}</Text>
          </View>
        </Pressable>
      </Group>
    </>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  title: typography.rowTitle,
  sub: { ...typography.caption, marginTop: 2, lineHeight: 16 },
});
