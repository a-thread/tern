import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, space } from '@shared/theme';
import {
  Group,
  FootNote,
  PushHeader,
  ToggleRow,
  SegmentedControl,
} from '@shared/components/ui';
import { useSettings } from '../../domain/settings/SettingsContext';
import { CaloriesTab } from './components/CaloriesTab/CaloriesTab';
import { MacrosTab } from './components/MacrosTab/MacrosTab';

enum Tab {
  Calories = 'calories',
  Macros = 'macros',
}
const TABS = Object.values(Tab);
const TAB_LABEL: Record<Tab, string> = {
  [Tab.Calories]: 'Calories',
  [Tab.Macros]: 'Macros',
};

export default function TargetsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [tab, setTab] = useState<Tab>(Tab.Calories);

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Targets'
        backLabel='Back'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <Group style={{ marginTop: 6 }}>
          <ToggleRow
            title='Track calories & macros'
            sub='Off logs meals with no targets at all'
            on={settings.trackCalories}
            onToggle={(v) => updateSettings({ trackCalories: v })}
          />
        </Group>

        {settings.trackCalories ? (
          <>
            <SegmentedControl
              style={{ marginTop: space.md }}
              options={TABS}
              value={tab}
              onChange={setTab}
              label={(t) => TAB_LABEL[t]}
            />

            {tab === Tab.Calories ? <CaloriesTab /> : <MacrosTab />}

            <FootNote>
              Targets are a reference point, not a limit. Tern won't alert you
              for going over, and going over never affects your streak or
              waypoints.
            </FootNote>
          </>
        ) : (
          <FootNote>
            Meals still log calories and macros in the background — they're just
            not shown as a target.
          </FootNote>
        )}
      </ScrollView>
    </View>
  );
}
