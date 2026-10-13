import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { PushHeader } from '@shared/components/ui';

/** A page one level into Settings: the header back to the index, and its groups scrolling below. */
export function SettingsPage({
  title,
  backLabel = 'Settings',
  children,
}: {
  title: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <PushHeader title={title} backLabel={backLabel} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 60 }}>
        {children}
      </ScrollView>
    </View>
  );
}
