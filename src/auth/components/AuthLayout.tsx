import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space } from '@shared/theme';

/** Shared frame for every auth screen: logo, title, subtitle, then the form. */
export function AuthLayout({
  title,
  subtitle,
  showMark,
  children,
}: {
  title: string;
  subtitle: string;
  showMark?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: space.lg,
        }}
      >
        {showMark ? (
          <View style={s.mark}>
            <Image
              source={require('../../../assets/logo-header.png')}
              style={s.markImage}
              resizeMode='contain'
              accessibilityLabel='Tern'
            />
          </View>
        ) : null}
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  mark: { alignItems: 'center', marginBottom: space.sm },
  // logo-header.png is the app icon artwork pre-cropped to this frame's ratio and
  // sized for it (660x390 = 3x), instead of decoding the 2000x2000 launcher icon.
  markImage: { width: 220, height: 130 },
  title: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: space.lg,
    lineHeight: 19,
  },
});
