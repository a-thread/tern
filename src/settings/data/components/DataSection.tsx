import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@shared/theme';
import { Group } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';
import { useData } from '@/domain/settings/DataContext';
import { confirm } from '@shared/utils/confirm';

/** Export everything Tern holds, or erase it. Only offered for a signed-in account. */
export function DataSection() {
  const data = useData();
  const auth = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const copy = await data.exportAll();
      await Share.share({
        title: 'Tern data',
        message: JSON.stringify(copy, null, 2),
      });
    } catch (e) {
      console.warn('Could not export data', e);
      toast.show("Couldn't export your data — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteData = () => {
    if (busy) return;
    confirm({
      title: 'Delete all your data?',
      message:
        "This erases your food log, saved meals, weigh-ins, water, movement, medication and mood history, waypoints, rest days and settings from Tern. It can't be undone. You'll be signed out, and your login stays so you can start fresh.",
      action: 'Delete',
      onConfirm: async () => {
        setBusy(true);
        try {
          await data.deleteAll();
          await auth?.signOut();
        } catch (e) {
          console.warn('Could not delete data', e);
          toast.show("Couldn't delete your data — please try again.");
          setBusy(false);
        }
      },
    });
  };

  const deleteAccount = () => {
    if (busy) return;
    confirm({
      title: 'Delete your account?',
      message:
        "This permanently deletes your account and everything in it: your food log, saved meals, weigh-ins, water, movement, medication and mood history, waypoints, rest days and settings. It can't be undone.",
      action: 'Delete account',
      onConfirm: async () => {
        setBusy(true);
        try {
          await data.deleteAccount();
        } catch (e) {
          console.warn('Could not delete account', e);
          toast.show("Couldn't delete your account — please try again.");
          setBusy(false);
          return;
        }
        // The login is gone, so ending the session is best effort.
        try {
          await auth?.signOut();
        } catch (e) {
          console.warn('Could not sign out after deleting the account', e);
        }
      },
    });
  };

  return (
    <Group>
      <Pressable style={s.row} onPress={exportData} disabled={busy}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Export my data</Text>
          <Text style={s.sub}>A copy of everything Tern holds, as JSON</Text>
        </View>
      </Pressable>
      <Pressable style={s.row} onPress={deleteData} disabled={busy}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, s.danger]}>Delete my data</Text>
          <Text style={s.sub}>Erase your log, weigh-ins and waypoints</Text>
        </View>
      </Pressable>
      <Pressable style={s.row} onPress={deleteAccount} disabled={busy}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, s.danger]}>Delete my account</Text>
          <Text style={s.sub}>Remove your login and everything in it</Text>
        </View>
      </Pressable>
    </Group>
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
  danger: { color: colors.danger },
  sub: { ...typography.caption, marginTop: 2, lineHeight: 16 },
});
