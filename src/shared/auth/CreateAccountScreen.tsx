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
import {
  MIN_PASSWORD,
  isValidEmail,
  isValidPassword,
  passwordsMatch,
} from './validation';

export default function CreateAccountScreen({
  onCreated,
  onBack,
}: {
  onCreated: () => void;
  onBack: () => void;
}) {
  const auth = useAuth()!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, run } = useSubmit(
    'Unable to create account. Please try again.',
  );

  const canSubmit =
    isValidEmail(email) &&
    isValidPassword(password) &&
    passwordsMatch(password, confirm);

  const submit = async () => {
    if (!canSubmit) return;
    const ok = await run(() => auth.signUp(email.trim(), password));
    // With email confirmation on there's no session yet, so send them back to
    // sign in. (With it off they're already signed in and this unmounts.)
    if (ok) onCreated();
  };

  return (
    <AuthLayout
      title="Let's get started"
      subtitle='Fill in your email and create your free account.'
    >
      <AuthBanner variant='error' message={error || null} />

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
        autoComplete='new-password'
        value={password}
        onChangeText={setPassword}
        invalid={!isValidPassword(password)}
        errorMessage={`Password must be at least ${MIN_PASSWORD} characters`}
      />
      <FormField
        label='Confirm password'
        kind='password'
        autoComplete='new-password'
        value={confirm}
        onChangeText={setConfirm}
        invalid={!passwordsMatch(password, confirm)}
        errorMessage='Passwords do not match'
        onSubmitEditing={submit}
      />

      <SubmitButton
        label='Create account'
        busyLabel='Creating account…'
        busy={busy}
        disabled={!canSubmit}
        onPress={submit}
      />

      <LinkColumn>
        <LinkButton label='Back to sign in' onPress={onBack} />
      </LinkColumn>
    </AuthLayout>
  );
}
