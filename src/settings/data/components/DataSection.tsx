import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@shared/theme';
import { Group } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { useToast } from '@shared/state/ToastContext';
import { useData } from '@/domain/settings/DataContext';
import { confirm } from '@shared/utils/confirm';
import { parseTernExport } from '@/domain/settings/models/ternExport';
import { ExportOutcome, pickExport, saveExport } from '../utils/backupFile';
import { usePlusLapsed } from '../../hooks/usePlusLapsed';
import { manageSubscription } from '../../utils/manageSubscription';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { storeName } from '@shared/utils/storeApp';

/**
 * Export everything Tern holds, restore it from an export, or erase it: in the account when
 * signed in with Tern Plus, on the phone otherwise. Once Plus has ended, erasing reaches both.
 */
export function DataSection() {
  const data = useData();
  const auth = useAuth();
  const signedIn = Boolean(auth?.session);
  const lapsed = usePlusLapsed();
  // Where a restore lands: the phone, unless signed in with Plus (then the account).
  const onPhone = !signedIn || lapsed;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  // A store subscription that will charge again: deleting the account doesn't stop it.
  const plus = useSubscription();
  const stillCharging =
    signedIn &&
    plus.checkedFor === auth?.session?.user.id &&
    plus.status.active &&
    plus.status.renews &&
    plus.status.expiresAt !== null;

  const exportData = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { outcome, savedAs } = await saveExport(await data.exportAll());
      if (outcome === ExportOutcome.Saved) toast.show(`Saved ${savedAs}.`);
    } catch (e) {
      console.warn('Could not export data', e);
      toast.show("Couldn't export your data — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const restoreData = async () => {
    if (busy) return;
    let text: string | null;
    try {
      text = await pickExport();
    } catch (e) {
      console.warn('Could not read the chosen file', e);
      toast.show("Couldn't open that file — please try again.");
      return;
    }
    if (text === null) return;
    const parsed = parseTernExport(text);
    if (!parsed.ok) {
      toast.show(parsed.message);
      return;
    }
    confirm({
      title: 'Restore from this file?',
      message: onPhone
        ? "Everything in the export is added to this phone. Anything already here stays, and your settings are replaced by the file's."
        : 'Everything in the export is added to your account. Anything already there stays, and so do your settings.',
      action: 'Restore',
      destructive: false,
      onConfirm: async () => {
        setBusy(true);
        try {
          // Tern reloads itself once the rows are in.
          const added = await data.importAll(parsed.copy);
          toast.show(
            added
              ? `Restored ${added} ${added === 1 ? 'entry' : 'entries'}.`
              : 'Everything in that file was already here.',
          );
        } catch (e) {
          console.warn('Could not restore data', e);
          toast.show("Couldn't restore that file — nothing was changed.");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const deleteData = () => {
    if (busy) return;
    confirm({
      title: 'Delete all your data?',
      message: `This erases your food log, saved meals, weigh-ins, water, movement, medication and mood history, waypoints, rest days and settings from ${signedIn ? 'Tern' : 'this phone'}. It can't be undone. ${signedIn ? "You'll be signed out, and your login stays so you can start fresh." : 'Tern starts fresh.'}`,
      action: 'Delete',
      onConfirm: async () => {
        setBusy(true);
        try {
          // On the phone, Tern reloads itself once the data is gone.
          await data.deleteAll();
          if (signedIn) await auth?.signOut();
        } catch (e) {
          console.warn('Could not delete data', e);
          toast.show("Couldn't delete your data — please try again.");
          setBusy(false);
        }
      },
    });
  };

  const openStore = () =>
    manageSubscription().catch((e) => {
      console.warn('Could not open the store', e);
      toast.show(`Couldn't open ${storeName()} — cancel Tern Plus from its subscriptions page.`);
    });

  const deleteAccount = () => {
    if (busy) return;
    const store = storeName();
    confirm({
      title: 'Delete your account?',
      message:
        "This permanently deletes your account and everything in it: your food log, saved meals, weigh-ins, water, movement, medication and mood history, waypoints, rest days and settings. It can't be undone." +
        // The store bills for Tern Plus, not Tern: a deleted account keeps being charged.
        (stillCharging
          ? `\n\nThis doesn't cancel Tern Plus. Cancel it in ${store} first, or you'll keep being charged.`
          : ''),
      action: 'Delete account',
      also: stillCharging
        ? { text: `Open ${store}`, onPress: openStore }
        : undefined,
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
          <Text style={s.sub}>Save a file of everything, to restore from later</Text>
        </View>
      </Pressable>
      {data.canImport ? (
        <Pressable
          style={s.row}
          onPress={restoreData}
          disabled={busy}
          accessibilityRole='button'
        >
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Restore from a file</Text>
            <Text style={s.sub}>Add back everything in a Tern export</Text>
          </View>
        </Pressable>
      ) : null}
      <Pressable style={s.row} onPress={deleteData} disabled={busy}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, s.danger]}>Delete my data</Text>
          <Text style={s.sub}>Erase your log, weigh-ins and waypoints</Text>
        </View>
      </Pressable>
      {signedIn ? (
        <Pressable style={s.row} onPress={deleteAccount} disabled={busy}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, s.danger]}>Delete my account</Text>
            <Text style={s.sub}>Remove your login and everything in it</Text>
          </View>
        </Pressable>
      ) : null}
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
