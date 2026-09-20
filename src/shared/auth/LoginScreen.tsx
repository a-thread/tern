import React, { useState } from 'react';

import { useAuth } from './AuthContext';
import {
  AuthBanner,
  AuthLayout,
  FormField,
  LinkButton,
  LinkColumn,
  SubmitButton,
} from './components';
import { useSubmit } from './useSubmit';
import { isValidEmail, isValidPassword } from './validation';

export default function LoginScreen({
  infoMessage,
  onForgotPassword,
  onCreateAccount,
}: {
  infoMessage?: string;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
}) {
  const auth = useAuth()!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useSubmit('Incorrect email or password');

  const canSubmit = isValidEmail(email) && isValidPassword(password);
  // On success the session changes and AuthGate swaps this screen out.
  const submit = () => {
    if (canSubmit) run(() => auth.signIn(email.trim(), password));
  };

  return (
    <AuthLayout
      showMark
      title='Tern'
      subtitle='Fly far. Keep every mile.'
    >
      <AuthBanner variant='error' message={error || null} />
      <AuthBanner variant='info' message={infoMessage ?? null} />

      <FormField
        label='Email address'
        kind='email'
        autoComplete='email'
        value={email}
        onChangeText={setEmail}
        invalid={!isValidEmail(email)}
        errorMessage='Enter a valid email address'
      />
      <FormField
        label='Password'
        kind='password'
        autoComplete='current-password'
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
      />

      <SubmitButton
        label='Sign in'
        busyLabel='Signing in…'
        busy={busy}
        disabled={!canSubmit}
        onPress={submit}
      />

      <LinkColumn>
        <LinkButton label='Forgot password?' onPress={onForgotPassword} />
        <LinkButton label='Create an account' onPress={onCreateAccount} />
        <LinkButton
          label='Continue without an account'
          onPress={auth.continueAsGuest}
        />
      </LinkColumn>
    </AuthLayout>
  );
}
