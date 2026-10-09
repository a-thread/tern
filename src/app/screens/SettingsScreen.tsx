import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, space } from '@shared/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { FootNote, Group, GroupLabel, IconBadge, PushHeader } from '@shared/components/ui';
import type { SettingsStackParamList } from '@shared/navigation/types';
import { useBackend } from '@app/BackendContext';
import { useSettings } from '@settings/SettingsContext';
import { ProfileSection } from '@settings/components/ProfileSection';
import { SectionRow } from '@settings/components/SectionRow';
import { UnitsRow } from '@settings/components/UnitsRow';
import { AccountSection } from '@settings/components/AccountSection';
import { healthDataSummary, remindersSummary } from '@settings/models/settingsSummary';
import { activitySummary } from '@today/models/settingsSummary';
import { foodSummary } from '@food/models/settingsSummary';
import { weightSummary } from '@weight/models/settingsSummary';
import { waterSummary } from '@water/models/settingsSummary';
import { moodSummary } from '@mood/models/settingsSummary';
import { medicationSummary } from '@medication/models/settingsSummary';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsRoot'>;

/**
 * The settings index: one row per section, each with a line saying how it's set, so the
 * whole page fits on a screen. Each section's page is made of rows its feature supplies,
 * and each feature supplies its own summary line here.
 */
export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: dataRepo } = useBackend();
  const { settings } = useSettings();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <PushHeader title='Settings' backLabel='Back' onBack={() => navigation.getParent()?.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 60 }}>
        <ProfileSection />

        <GroupLabel>Tracking</GroupLabel>
        <Group>
          <SectionRow
            icon='shoe-print'
            color={colors.sunDeep}
            tint={colors.sunTint}
            title='Steps and activity'
            summary={activitySummary(settings)}
            onPress={() => navigation.navigate('ActivitySettings')}
          />
          <SectionRow
            icon='silverware-fork-knife'
            color={colors.kelp}
            tint={colors.kelpTint}
            title='Food'
            summary={foodSummary(settings)}
            onPress={() => navigation.navigate('FoodSettings')}
          />
          <SectionRow
            icon='scale-bathroom'
            color={colors.glacierDeep}
            tint={colors.glacierTint}
            title='Weight'
            summary={weightSummary(settings)}
            onPress={() => navigation.navigate('WeightSettings')}
          />
          <SectionRow
            icon='water-outline'
            color={colors.water}
            tint={colors.waterTint}
            title='Water'
            summary={waterSummary(settings)}
            onPress={() => navigation.navigate('WaterSettings')}
          />
          <SectionRow
            icon='emoticon-happy-outline'
            color={colors.violet}
            tint={colors.violetTint}
            title='Mood and stress'
            summary={moodSummary(settings)}
            onPress={() => navigation.navigate('MoodSettings')}
          />
          <SectionRow
            icon='pill'
            color={colors.aurora}
            tint={colors.auroraTint}
            title='Medication'
            summary={medicationSummary(settings)}
            onPress={() => navigation.navigate('Medication')}
          />
        </Group>

        <GroupLabel>App</GroupLabel>
        <Group>
          <SectionRow
            icon='bell-outline'
            color={colors.coral}
            tint={colors.coralTint}
            title='Reminders'
            summary={remindersSummary(settings)}
            onPress={() => navigation.navigate('RemindersSettings')}
          />
          <SectionRow
            icon='heart-pulse'
            color={colors.coral}
            tint={colors.coralTint}
            title='Health data'
            summary={healthDataSummary(settings)}
            onPress={() => navigation.navigate('HealthData')}
          />
          <UnitsRow
            icon={
              <IconBadge bg={colors.doveTint}>
                <MaterialCommunityIcons name='ruler' size={17} color={colors.ink2} />
              </IconBadge>
            }
          />
          {dataRepo ? (
            <SectionRow
              icon='database-outline'
              color={colors.driftwood}
              tint={colors.driftwoodTint}
              title='Your data'
              summary='Export or delete'
              onPress={() => navigation.navigate('DataSettings')}
            />
          ) : null}
        </Group>

        <AccountSection />

        <FootNote>
          Nutrition data from Open Food Facts, used under the Open Database License, and USDA
          FoodData Central.
        </FootNote>
      </ScrollView>
    </View>
  );
}
