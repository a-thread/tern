import React, { useState } from 'react';

import { useAuth } from '@/domain/auth/AuthContext';
import { AuthBanner } from '@/auth/components/AuthBanner';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { FormField } from '@/auth/components/FormField';
import { LinkButton } from '@/auth/components/LinkButton';
import { LinkColumn } from '@/auth/components/LinkColumn';
import { SubmitButton } from '@/auth/components/SubmitButton';
import { useSubmit } from '@/auth/hooks/useSubmit';
import { isValidEmail } from '@/domain/auth/validation';

export default function ForgotPasswordScreen({
  onBack,
}: {
  onBack: () => void;
}) {
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
