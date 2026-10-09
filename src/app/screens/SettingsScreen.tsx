import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, space } from '@shared/theme';
import { FootNote, Group, GroupLabel, PushHeader } from '@shared/components/ui';
import type { SettingsStackParamList } from '@shared/navigation/types';
import { useBackend } from '@app/BackendContext';
import { useSettings } from '@settings/SettingsContext';
import { ProfileSection } from '@settings/components/ProfileSection';
import { UnitsRow } from '@settings/components/UnitsRow';
import { DataSection } from '@settings/components/DataSection';
import { AccountSection } from '@settings/components/AccountSection';
import { StepGoalRow } from '@today/components/StepGoalRow';
import { RestDaysRow } from '@today/components/RestDaysRow';
import { HealthDataRow } from '@today/components/HealthDataRow';
import { CalorieTargetsRow } from '@food/components/CalorieTargetsRow';
import { FoodDisplayRow } from '@food/components/FoodDisplayRow';
import { StreakReminderRows } from '@today/components/StreakReminderRows';
import { MealReminderRows } from '@food/components/MealReminderRows';
import { MedicationRow } from '@medication/components/MedicationRow';
import { WeightSettingsRows } from '@weight/components/WeightSettingsRows';
import { WeightReminderRows } from '@weight/components/WeightReminderRows';
import { WaterSettingsRows } from '@water/components/WaterSettingsRows';
import { WaterReminderRows } from '@water/components/WaterReminderRows';
import { MoodSettingsRows } from '@mood/components/MoodSettingsRows';
import { MoodReminderRows } from '@mood/components/MoodReminderRows';
import { MovementSettingsRows } from '@movement/components/MovementSettingsRows';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsRoot'>;

/**
 * The settings menu. It only arranges sections: each feature supplies the rows for what it
 * owns, so a new feature adds its settings here without this screen knowing how they work.
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

        <GroupLabel>Units</GroupLabel>
        <Group>
          <UnitsRow />
        </Group>

        <GroupLabel>Activity</GroupLabel>
        <Group>
          <StepGoalRow onPress={() => navigation.navigate('StepGoal')} />
          <HealthDataRow onPress={() => navigation.navigate('HealthData')} />
          <RestDaysRow onPress={() => navigation.navigate('RestDays')} />
          <StreakReminderRows />
          <MovementSettingsRows />
        </Group>

        <GroupLabel>Food</GroupLabel>
        <Group>
          <CalorieTargetsRow onPress={() => navigation.navigate('Targets')} />
          <FoodDisplayRow onPress={() => navigation.navigate('FoodDisplay')} />
          <MealReminderRows />
        </Group>

        <GroupLabel>Medication</GroupLabel>
        <Group>
          <MedicationRow onPress={() => navigation.navigate('Medication')} />
        </Group>

        <GroupLabel>Weight</GroupLabel>
        <Group>
          <WeightSettingsRows />
          {settings.trackWeight ? <WeightReminderRows /> : null}
        </Group>

        <GroupLabel>Water</GroupLabel>
        <Group>
          <WaterSettingsRows />
          {settings.trackWater ? <WaterReminderRows /> : null}
        </Group>

        <GroupLabel>Mood &amp; stress</GroupLabel>
        <Group>
          <MoodSettingsRows />
          {settings.trackMood ? <MoodReminderRows /> : null}
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
