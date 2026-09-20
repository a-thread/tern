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
import { isValidEmail } from './validation';

export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const auth = useAuth()!;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useSubmit(
    'Unable to send reset email. Please try again.',
  );

  const canSubmit = isValidEmail(email);
  const submit = async () => {
    if (!canSubmit) return;
    if (await run(() => auth.sendPasswordReset(email.trim()))) setSent(true);
  };

  return (
    <AuthLayout
      title='Forgot your password?'
      subtitle="Enter the email address associated with your account and we'll send you instructions for resetting your password."
    >
      <AuthBanner variant='error' message={error || null} />
      <AuthBanner
        variant='info'
        message={sent ? 'Check your email for a password reset link.' : null}
      />

      <FormField
        label='Email address'
        kind='email'
        autoComplete='email'
        value={email}
        onChangeText={setEmail}
        invalid={!isValidEmail(email)}
        errorMessage='Enter a valid email address'
        onSubmitEditing={submit}
      />

      <SubmitButton
        label='Send reset link'
        busyLabel='Sending…'
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
