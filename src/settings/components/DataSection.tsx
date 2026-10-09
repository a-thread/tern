import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { Group, GroupLabel } from '@shared/components/ui';
import { useAuth } from '@shared/auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';
import type { DataRepository } from '@settings/data/dataRepository';

/** Export everything Tern holds, or erase it. Only offered for a signed-in account. */
export function DataSection({ repo }: { repo: DataRepository }) {
  const auth = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const copy = await repo.exportAll();
      await Share.share({ title: 'Tern data', message: JSON.stringify(copy, null, 2) });
    } catch (e) {
      console.warn('Could not export data', e);
      toast.show("Couldn't export your data — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteData = () => {
    if (busy) return;
    Alert.alert(
      'Delete all your data?',
      "This erases your food log, saved meals, weigh-ins, water, movement, medication and mood history, waypoints, rest days and settings from Tern. It can't be undone. You'll be signed out, and your login stays so you can start fresh.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await repo.deleteAll();
              await auth?.signOut();
            } catch (e) {
              console.warn('Could not delete data', e);
              toast.show("Couldn't delete your data — please try again.");
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    if (busy) return;
    Alert.alert(
      'Delete your account?',
      "This permanently deletes your account and everything in it: your food log, saved meals, weigh-ins, water, movement, medication and mood history, waypoints, rest days and settings. It can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await repo.deleteAccount();
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
        },
      ],
    );
  };

  return (
    <>
      <GroupLabel>Your data</GroupLabel>
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
  title: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  danger: { color: '#B3261E' },
  sub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2, marginTop: 2, lineHeight: 16 },
});
