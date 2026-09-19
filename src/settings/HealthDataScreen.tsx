import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  IconBadge,
  Chip,
  FootNote,
} from '@shared/components/ui';
import { useSettings } from './SettingsContext';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'HealthData'>;

export default function HealthDataScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const hd = settings.healthData;

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
            <Svg
              width={17}
              height={17}
              viewBox='0 0 24 24'
              fill='none'
              stroke='#3B6B4A'
              strokeWidth={2}
            >
              <Path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z' />
            </Svg>
          </IconBadge>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Health Connect</Text>
            <Text style={s.rowSub}>Last synced {hd.lastSynced}</Text>
          </View>
          <Chip bg='#E4EFE6' color='#3B6B4A'>
            {hd.connected ? 'On' : 'Off'}
          </Chip>
        </View>

        <GroupLabel>Reading from Health Connect</GroupLabel>
        <Group>
          <ToggleRow
            title='Steps'
            sub='Used for your daily goal'
            on={hd.readSteps}
            onToggle={(v) => patchHealthData({ readSteps: v })}
          />
          <ToggleRow
            title='Distance'
            sub='Shown on the Trends tab'
            on={hd.readDistance}
            onToggle={(v) => patchHealthData({ readDistance: v })}
          />
          <ToggleRow
            title='Weight'
            sub='From a connected scale, if you have one'
            on={hd.readWeight}
            onToggle={(v) => patchHealthData({ readWeight: v })}
          />
        </Group>

        <GroupLabel>Writing to Health Connect</GroupLabel>
        <Group>
          <ToggleRow
            title='Weight entries'
            sub='Share weights you log in Tern'
            on={hd.writeWeight}
            onToggle={(v) => patchHealthData({ writeWeight: v })}
          />
          <ToggleRow
            title='Nutrition'
            sub='Share calories and macros'
            on={hd.writeNutrition}
            onToggle={(v) => patchHealthData({ writeNutrition: v })}
          />
        </Group>

        <GroupLabel>If steps aren't syncing</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={[s.rowTitle, s.link, { flex: 1 }]}>Sync now</Text>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, s.link]}>Enter steps manually</Text>
              <Text style={s.rowSub}>Works with no connection at all</Text>
            </View>
          </View>
        </Group>

        <FootNote>
          Tern reads only what's switched on above, and never shares your health
          data with anyone. You can disconnect at any time and keep everything
          you've logged.
        </FootNote>

        <Pressable
          style={s.dangerBtn}
          onPress={() => patchHealthData({ connected: false })}
        >
          <Text style={s.dangerText}>Disconnect Health Connect</Text>
        </Pressable>
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
