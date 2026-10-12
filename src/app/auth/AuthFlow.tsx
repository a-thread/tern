import React, { useState } from 'react';

import { useAuth } from '@/domain/auth/AuthContext';
import LoginScreen from '@/auth/login/LoginScreen';
import CreateAccountScreen from '@/auth/create-account/CreateAccountScreen';
import ForgotPasswordScreen from '@/auth/forgot-password/ForgotPasswordScreen';

type Screen = 'login' | 'signUp' | 'forgotPassword';

/**
 * The signed-out screens. A plain state switch rather than a navigator: the
 * app's NavigationContainer only mounts once someone is in.
 */
export default function AuthFlow() {
  const { startOnSignUp } = useAuth()!;
  const [screen, setScreen] = useState<Screen>(startOnSignUp ? 'signUp' : 'login');
  const [info, setInfo] = useState<string | undefined>();

  const goTo = (next: Screen, message?: string) => {
    setInfo(message);
    setScreen(next);
  };

  if (screen === 'signUp') {
    return (
      <CreateAccountScreen
        onBack={() => goTo('login')}
        onCreated={() =>
          goTo('login', 'Check your email to confirm your account.')
        }
      />
    );
  }
  if (screen === 'forgotPassword') {
    return <ForgotPasswordScreen onBack={() => goTo('login')} />;
  }
  return (
    <LoginScreen
      infoMessage={info}
      onForgotPassword={() => goTo('forgotPassword')}
      onCreateAccount={() => goTo('signUp')}
    />
  );
}
