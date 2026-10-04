import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, space } from '@shared/theme';
import { FootNote, Group, GroupLabel, PushHeader } from '@shared/components/ui';
import type { SettingsStackParamList } from '@shared/navigation/types';
import { useBackend } from '@app/BackendContext';
import { ProfileSection } from '@settings/components/ProfileSection';
import { UnitsRow } from '@settings/components/UnitsRow';
import { DataSection } from '@settings/components/DataSection';
import { AccountSection } from '@settings/components/AccountSection';
import { StepGoalRow } from '@today/components/StepGoalRow';
import { RestDaysRow } from '@today/components/RestDaysRow';
import { HealthDataRow } from '@today/components/HealthDataRow';
import { CalorieTargetsRow } from '@food/components/CalorieTargetsRow';
import { FoodDisplayRow } from '@food/components/FoodDisplayRow';
import { MealReminderRows } from '@food/components/MealReminderRows';
import { MedicationRow } from '@medication/components/MedicationRow';
import { WeightSettingsRows } from '@weight/components/WeightSettingsRows';
import { WeightReminderRows } from '@weight/components/WeightReminderRows';
import { WaterSettingsRows } from '@water/components/WaterSettingsRows';
import { WaterReminderRows } from '@water/components/WaterReminderRows';
import { MoodSettingsRows } from '@mood/components/MoodSettingsRows';
import { MoodReminderRows } from '@mood/components/MoodReminderRows';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsRoot'>;

/**
 * The settings menu. It only arranges sections: each feature supplies the rows for what it
 * owns, so a new feature adds its settings here without this screen knowing how they work.
 */
export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: dataRepo } = useBackend();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <PushHeader title='Settings' backLabel='Back' onBack={() => navigation.getParent()?.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 60 }}>
        <ProfileSection />

        <GroupLabel>Goals</GroupLabel>
        <Group>
          <StepGoalRow onPress={() => navigation.navigate('StepGoal')} />
          <CalorieTargetsRow onPress={() => navigation.navigate('Targets')} />
          <RestDaysRow onPress={() => navigation.navigate('RestDays')} />
        </Group>

        <GroupLabel>Data & display</GroupLabel>
        <Group>
          <UnitsRow />
          <FoodDisplayRow onPress={() => navigation.navigate('FoodDisplay')} />
          <HealthDataRow onPress={() => navigation.navigate('HealthData')} />
        </Group>

        <GroupLabel>Medication</GroupLabel>
        <Group>
          <MedicationRow onPress={() => navigation.navigate('Medication')} />
        </Group>

        <GroupLabel>Weight</GroupLabel>
        <Group>
          <WeightSettingsRows />
        </Group>

        <GroupLabel>Water</GroupLabel>
        <Group>
          <WaterSettingsRows />
        </Group>

        <GroupLabel>Mood &amp; stress</GroupLabel>
        <Group>
          <MoodSettingsRows />
        </Group>

        <GroupLabel>Reminders</GroupLabel>
        <Group>
          <MealReminderRows />
          <WeightReminderRows />
          <WaterReminderRows />
          <MoodReminderRows />
        </Group>

        {dataRepo ? <DataSection repo={dataRepo} /> : null}

        <AccountSection />

        <FootNote>
          Nutrition data from Open Food Facts, used under the Open Database License, and USDA
          FoodData Central.
        </FootNote>
      </ScrollView>
    </View>
  );
}
