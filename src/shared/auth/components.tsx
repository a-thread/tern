import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, space } from '@shared/theme';
import TernMark from '@shared/components/TernMark';

/** Shared frame for every auth screen: mark, title, subtitle, then the form. */
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
            <TernMark size={44} color={colors.ink} />
          </View>
        ) : null}
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Error or info message above a form; renders nothing when there's no message. */
export function AuthBanner({
  variant,
  message,
}: {
  variant: 'error' | 'info';
  message: string | null;
}) {
  if (!message) return null;
  return (
    <View style={[s.banner, variant === 'error' ? s.bannerError : s.bannerInfo]}>
      <Text style={s.bannerText}>{message}</Text>
    </View>
  );
}

/**
 * Text field that only shows its error once it has been touched (blurred),
 * so people aren't scolded while they're still typing.
 */
export function FormField({
  label,
  value,
  onChangeText,
  kind,
  autoComplete,
  invalid,
  errorMessage,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  kind: 'email' | 'password' | 'name';
  autoComplete: 'email' | 'current-password' | 'new-password' | 'given-name';
  invalid?: boolean;
  errorMessage?: string;
  onSubmitEditing?: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const showInvalid = touched && invalid;
  return (
    <View style={{ marginBottom: space.sm }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={() => setTouched(true)}
        onSubmitEditing={onSubmitEditing}
        secureTextEntry={kind === 'password'}
        keyboardType={kind === 'email' ? 'email-address' : 'default'}
        autoCapitalize={kind === 'name' ? 'words' : 'none'}
        autoCorrect={kind === 'name'}
        autoComplete={autoComplete}
        accessibilityLabel={label}
        style={[s.input, showInvalid && s.inputInvalid]}
      />
      {showInvalid && errorMessage ? (
        <Text style={s.fieldError}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

/** Coral primary action; disabled until the form is valid, and shows `busyLabel` while working. */
export function SubmitButton({
  label,
  busyLabel,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      style={[s.button, off && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={off}
    >
      {busy ? (
        <View style={s.busyRow}>
          <ActivityIndicator color='#fff' size='small' />
          <Text style={s.buttonText}>{busyLabel}</Text>
        </View>
      ) : (
        <Text style={s.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function LinkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}

export function LinkColumn({ children }: { children: React.ReactNode }) {
  return <View style={s.links}>{children}</View>;
}

const s = StyleSheet.create({
  mark: { alignItems: 'center', marginBottom: space.sm },
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
  banner: {
    borderRadius: radius.lg - 1,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    marginBottom: space.md,
  },
  bannerError: { backgroundColor: colors.coralTint },
  bannerInfo: { backgroundColor: colors.glacierTint },
  bannerText: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: colors.ink,
    lineHeight: 18,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: colors.ink2,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg - 1,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: space.md,
    paddingVertical: 13,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
  },
  inputInvalid: { borderColor: colors.coral },
  fieldError: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.coral,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg - 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: space.sm,
  },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontFamily: font.bold, fontSize: 14.5, color: '#fff' },
  links: { alignItems: 'center', gap: space.md, marginTop: space.lg },
  link: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink2 },
});
