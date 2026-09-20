import React, { useState } from 'react';

import { useAuth } from './AuthContext';
import {
  AuthBanner,
  AuthLayout,
  FormField,
  SubmitButton,
} from './components';
import { useSubmit } from './useSubmit';
import { MIN_PASSWORD, isValidPassword, passwordsMatch } from './validation';

/** Shown when a password-reset link brings someone back into the app. */
export default function ResetPasswordScreen() {
  const auth = useAuth()!;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, run } = useSubmit(
    'Unable to update password. Please try again.',
  );

  const canSubmit = isValidPassword(password) && passwordsMatch(password, confirm);
  // On success the recovery flag clears and AuthGate lets them into the app.
  const submit = () => {
    if (canSubmit) run(() => auth.updatePassword(password));
  };

  return (
    <AuthLayout
      title='Set new password'
      subtitle='Choose a new password for your account.'
    >
      <AuthBanner variant='error' message={error || null} />

      <FormField
        label='New password'
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
        label='Update password'
        busyLabel='Updating…'
        busy={busy}
        disabled={!canSubmit}
        onPress={submit}
      />
    </AuthLayout>
  );
}
