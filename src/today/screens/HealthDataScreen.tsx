import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, space } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  IconBadge,
  Chip,
  FootNote,
  Icon,
} from '@shared/components/ui';
import { formatLoggedAt } from '@weight/models/weightEntry';
import { useActivity, useLastSynced } from '@today/ActivityContext';
import { useSettings } from '@settings/SettingsContext';
import { StepsStatus } from '@today/data/steps.repository';
import { useMovement } from '@movement/MovementContext';

export default function HealthDataScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const hd = settings.healthData;
  const movement = useMovement();
  const { status, refresh, connect } = useActivity();
  const lastSynced = useLastSynced();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  /** Asks for access to steps (the Health Connect permission prompt) and says how it went. */
  const requestAccess = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await connect();
      toast.show(
        result === StepsStatus.Connected
          ? 'Health Connect is connected.'
          : result === StepsStatus.Unavailable
            ? "Health Connect isn't available on this device."
            : 'Tern still needs permission to read your steps.',
      );
    } catch (e) {
      console.warn('Could not connect Health Connect', e);
      toast.show("Couldn't connect Health Connect — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await refresh();
      toast.show(
        result === 'failed'
          ? "Couldn't sync your steps — please try again."
          : result === StepsStatus.Connected
            ? 'Steps synced.'
            : "Steps aren't connected — tap Off to allow access.",
      );
    } finally {
      setBusy(false);
    }
  };

  const patchHealthData = (patch: Partial<typeof hd>) =>
    updateSettings({ healthData: { ...hd, ...patch } });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Health data'
        backLabel='Settings'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.summaryCard}>
          <IconBadge bg='#E4EFE6'>
            <Icon name='heart-pulse' size={19} color='#3B6B4A' />
          </IconBadge>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Health Connect</Text>
            <Text style={s.rowSub}>
              {status === StepsStatus.Connected
                ? lastSynced
                  ? `Last synced ${formatLoggedAt(lastSynced.toISOString())}`
                  : 'Connected'
                : status === StepsStatus.NeedsPermission
                  ? 'Allow Tern to read your steps'
                  : 'Not available in this build of the app'}
            </Text>
          </View>
          {status === StepsStatus.Connected ? (
            <Chip bg='#E4EFE6' color='#3B6B4A'>
              On
            </Chip>
          ) : (
            <Pressable
              onPress={requestAccess}
              disabled={busy}
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel='Off. Tap to allow access to steps'
            >
              <Chip bg='#E4EFE6' color='#3B6B4A'>
                Off
              </Chip>
            </Pressable>
          )}
        </View>

        <GroupLabel>Reading from Health Connect</GroupLabel>
        <Group>
          <ToggleRow
            title='Steps'
            sub='Used for your daily goal. Off hides steps without deleting anything'
            on={hd.readSteps}
            onToggle={(v) => patchHealthData({ readSteps: v })}
          />
          {settings.trackMovement && movement.workoutsAvailable ? (
            <ToggleRow
              title='Workouts'
              sub='Count as movement. Read-only: they stay in Health Connect'
              on={hd.readWorkouts}
              onToggle={async (v) => {
                patchHealthData({ readWorkouts: v });
                if (v && !(await movement.connectWorkouts())) {
                  toast.show('Allow Tern to read exercise in Health Connect to count workouts.');
                }
              }}
            />
          ) : null}
        </Group>

        <GroupLabel>{status === StepsStatus.NeedsPermission ? 'Get started' : "If steps aren't syncing"}</GroupLabel>
        <Group>
          {status === StepsStatus.NeedsPermission ? (
            <Pressable style={s.row} onPress={requestAccess} disabled={busy}>
              <Text style={[s.rowTitle, s.link, { flex: 1 }]}>
                Connect Health Connect
              </Text>
            </Pressable>
          ) : (
            <Pressable style={s.row} onPress={syncNow} disabled={busy}>
              <Text style={[s.rowTitle, s.link, { flex: 1 }]}>Sync now</Text>
            </Pressable>
          )}
        </Group>

        <FootNote>
          Tern only reads your steps, and your workouts when movement is on, and
          never shares your health data with anyone. To disconnect, remove Tern's access in Health Connect; everything
          you've logged stays.
        </FootNote>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
  },
  link: { color: colors.coral },
  dangerBtn: { alignItems: 'center', paddingVertical: 11, marginTop: 8 },
  dangerText: { fontFamily: font.semibold, fontSize: 13.5, color: '#B3261E' },
});
