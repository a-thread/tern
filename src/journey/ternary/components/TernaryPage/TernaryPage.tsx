import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { PushHeader } from '@shared/components/ui';

/** A page of the ternary: the header back, and its groups scrolling below. */
export function TernaryPage({
  title,
  backLabel = 'Back',
  top,
  children,
}: {
  title: string;
  backLabel?: string;
  /** Drawn edge to edge above the groups, such as the flock's map. */
  top?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title={title}
        backLabel={backLabel}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: space.xxl + insets.bottom,
        }}
      >
        {top}
        {children}
      </ScrollView>
    </View>
  );
}
