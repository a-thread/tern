import React from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useBackGesture } from '../hooks/useBackGesture';

/**
 * Shared frame for every auth screen: a back button, logo, title, subtitle, then the form.
 * With `onBack`, the back button, a swipe in from the left edge and Android's back button all
 * go back (to Settings from sign-in, to sign-in from the others).
 */
export function AuthLayout({
  title,
  subtitle,
  showMark,
  onBack,
  backLabel = 'Back',
  children,
}: {
  title: string;
  subtitle: string;
  showMark?: boolean;
  onBack?: () => void;
  /** Where back goes, e.g. "Settings". */
  backLabel?: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { panHandlers, translateX } = useBackGesture(onBack);
  return (
    <View style={s.backdrop}>
      <Animated.View
        style={[s.page, { transform: [{ translateX }] }]}
        {...panHandlers}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {onBack ? (
            <View style={[s.nav, { paddingTop: insets.top + space.sm }]}>
              <Pressable
                onPress={onBack}
                hitSlop={10}
                style={s.back}
                accessibilityRole='button'
                accessibilityLabel={backLabel}
              >
                <Icon name='chevron-left' size={20} color={colors.coral} />
                <Text style={s.backText}>{backLabel}</Text>
              </Pressable>
            </View>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={{
              paddingTop: onBack ? space.xl : insets.top + 48,
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
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // What shows behind the page while it is swiped away.
  backdrop: { flex: 1, backgroundColor: colors.dove },
  page: { flex: 1, backgroundColor: colors.paper },
  nav: { paddingHorizontal: space.md },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { fontFamily: font.medium, fontSize: 15, color: colors.coral },
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
