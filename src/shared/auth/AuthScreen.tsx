import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, space } from '@shared/theme';
import TernMark from '@shared/components/TernMark';
import { useAuth } from './AuthContext';

const MIN_PASSWORD = 8;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const auth = useAuth()!;
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const creating = mode === 'signUp';
  const canSubmit =
    email.includes('@') && password.length >= (creating ? MIN_PASSWORD : 1);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setMessage(null);
    const result = creating
      ? await auth.signUp(email.trim(), password)
      : await auth.signIn(email.trim(), password);
    setBusy(false);
    if (result.error) setMessage(result.error);
    else if (result.needsConfirmation)
      setMessage('Check your email to confirm your account, then sign in.');
    // On success the session changes and AuthGate swaps this screen out.
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.root, { paddingTop: insets.top + 56 }]}
    >
      <View style={s.mark}>
        <TernMark size={44} color={colors.ink} />
      </View>
      <Text style={s.title}>Tern</Text>
      <Text style={s.sub}>
        {creating ? 'Create an account to keep your log safe.' : 'Welcome back.'}
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder='Email'
        placeholderTextColor={colors.ink3}
        autoCapitalize='none'
        autoComplete='email'
        keyboardType='email-address'
        style={s.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={creating ? `Password (${MIN_PASSWORD}+ characters)` : 'Password'}
        placeholderTextColor={colors.ink3}
        secureTextEntry
        autoCapitalize='none'
        autoComplete={creating ? 'new-password' : 'current-password'}
        onSubmitEditing={submit}
        style={s.input}
      />

      {message ? <Text style={s.message}>{message}</Text> : null}

      <Pressable
        style={[s.button, (!canSubmit || busy) && { opacity: 0.5 }]}
        onPress={submit}
        disabled={!canSubmit || busy}
      >
        {busy ? (
          <ActivityIndicator color='#fff' />
        ) : (
          <Text style={s.buttonText}>{creating ? 'Create account' : 'Sign in'}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setMode(creating ? 'signIn' : 'signUp');
          setMessage(null);
        }}
        hitSlop={8}
      >
        <Text style={s.switch}>
          {creating ? 'Have an account? Sign in' : 'New here? Create an account'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: space.lg },
  mark: { alignItems: 'center' },
  title: {
    fontFamily: font.display,
    fontSize: 30,
    color: colors.ink,
    textAlign: 'center',
    marginTop: space.sm,
  },
  sub: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: space.lg,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg - 1,
    paddingHorizontal: space.md,
    paddingVertical: 13,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
    marginBottom: space.sm,
  },
  message: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.ink2,
    marginBottom: space.sm,
  },
  button: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg - 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: space.sm,
  },
  buttonText: { fontFamily: font.bold, fontSize: 14.5, color: '#fff' },
  switch: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: space.md,
  },
});
