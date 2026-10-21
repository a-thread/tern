import React, { useState } from 'react';
import LoadingScreen from '@shared/components/LoadingScreen/LoadingScreen';

import { useAuth } from '../domain/auth/AuthContext';
import { useSubscription } from '../domain/subscription/SubscriptionContext';
import LoginScreen from './login/LoginScreen';
import CreateAccountScreen from './create-account/CreateAccountScreen';
import ForgotPasswordScreen from './forgot-password/ForgotPasswordScreen';
import PaywallScreen from './paywall/PaywallScreen';

enum Screen {
  Login = 'login',
  SignUp = 'signUp',
  ForgotPassword = 'forgotPassword',
}

/**
 * The sign-in screens, opened from Settings. A plain state switch rather than a navigator:
 * the app's NavigationContainer only mounts once someone is in. Making an account is Tern
 * Plus, so without it the paywall stands in front of the sign-up form; once Plus is on
 * (bought or restored) the form shows. Signing in to an existing account stays open.
 */
export default function AuthFlow() {
  const { startOnSignUp, closeSignIn } = useAuth()!;
  const subscription = useSubscription();
  const [screen, setScreen] = useState<Screen>(
    startOnSignUp ? Screen.SignUp : Screen.Login,
  );
  const [info, setInfo] = useState<string | undefined>();

  const goTo = (next: Screen, message?: string) => {
    setInfo(message);
    setScreen(next);
  };

  if (screen === Screen.SignUp) {
    // Wait for the status, so someone who has Plus never sees the paywall flash by.
    if (!subscription.ready) return <LoadingScreen />;
    if (!subscription.active) {
      return (
        <PaywallScreen
          // Came straight from Settings: "Not now" goes back there.
          onBack={() => (startOnSignUp ? closeSignIn() : goTo(Screen.Login))}
        />
      );
    }
    return (
      <CreateAccountScreen
        onBack={() => goTo(Screen.Login)}
        onCreated={() =>
          goTo(Screen.Login, 'Check your email to confirm your account.')
        }
      />
    );
  }
  if (screen === Screen.ForgotPassword) {
    return <ForgotPasswordScreen onBack={() => goTo(Screen.Login)} />;
  }
  return (
    <LoginScreen
      infoMessage={info}
      onForgotPassword={() => goTo(Screen.ForgotPassword)}
      onCreateAccount={() => goTo(Screen.SignUp)}
    />
  );
}
